import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { slotApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, Clock, User, Repeat, AlertCircle, CalendarRange, GraduationCap, Ticket, Sparkles, List, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { AvailabilitySlot } from '../types';
import { SplitFlapTime } from '../components/ui/SplitFlapTime';
import { BoardingPassTicket } from '../components/ui/BoardingPassTicket';
import { TimetableGrid } from '../components/ui/TimetableGrid';
import { FloatingToast } from '../components/ui/FloatingToast';

/** Returns "1 booking" / "2 bookings" etc. */
function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export const LecturerDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [listFilter, setListFilter] = useState<'ALL' | 'BOOKED' | 'OPEN' | 'CANCELLED'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('10:30');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState(4);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastSuccessMsg, setToastSuccessMsg] = useState<string | null>(null);
  const [toastErrorMsg, setToastErrorMsg] = useState<string | null>(null);

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['my-slots'],
    queryFn: slotApi.getMySlots,
  });

  const createMutation = useMutation({
    mutationFn: slotApi.createSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-slots'] });
      setShowModal(false);
      setFormError(null);
      setToastSuccessMsg('Availability slot published successfully!');
      setTimeout(() => setToastSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create slot');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: slotApi.cancelSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-slots'] });
      setToastSuccessMsg('Slot cancelled successfully.');
      setTimeout(() => setToastSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setToastErrorMsg(err.message || 'Failed to cancel slot');
      setTimeout(() => setToastErrorMsg(null), 4000);
    },
  });

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (startTime >= endTime) {
      setFormError('End time must be after start time');
      return;
    }
    createMutation.mutate({ date, startTime, endTime, isRecurring, recurringWeeks: Number(recurringWeeks) });
  };

  const handleSelectEmptyCell = (cellDate: string, cellStartTime: string) => {
    setDate(cellDate);
    setStartTime(cellStartTime);
    const [h, m] = cellStartTime.split(':').map(Number);
    const endMinutes = h * 60 + m + 30;
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
    const endM = String(endMinutes % 60).padStart(2, '0');
    setEndTime(`${endH}:${endM}`);
    setShowModal(true);
  };

  const bookedSlots = slots.filter((s: AvailabilitySlot) => s.status === 'BOOKED');
  const openSlots   = slots.filter((s: AvailabilitySlot) => s.status === 'OPEN');
  const cancelledSlots = slots.filter((s: AvailabilitySlot) => s.status === 'CANCELLED');

  const filteredListSlots = slots.filter((s: AvailabilitySlot) => {
    if (listFilter === 'BOOKED') return s.status === 'BOOKED';
    if (listFilter === 'OPEN') return s.status === 'OPEN';
    if (listFilter === 'CANCELLED') return s.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Floating Viewport Toast System */}
      <FloatingToast
        successMsg={toastSuccessMsg}
        errorMsg={toastErrorMsg}
        onCloseSuccess={() => setToastSuccessMsg(null)}
        onCloseError={() => setToastErrorMsg(null)}
      />

      {/* Header + Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest font-mono font-bold text-zinc-400 dark:text-zinc-500">
            LECTURER PORTAL • OFFICE HOURS
          </p>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
            <span>{user?.name}</span>
          </h1>
          {/* Inline status bar */}
          {!isLoading && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 tabular-nums flex items-center gap-2">
              <span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">{bookedSlots.length}</span>
                {' '}{bookedSlots.length === 1 ? 'booking' : 'bookings'}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">{openSlots.length}</span>
                {' '}open {openSlots.length === 1 ? 'slot' : 'slots'}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">{slots.length}</span>
                {' '}total
              </span>
            </p>
          )}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Publish Availability</span>
        </button>
      </div>

      {/* Main Grid Layout (Constant 2-column Structure) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Confirmed Appointments (Boarding Pass Tickets) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
              Confirmed Appointments
            </h2>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              {plural(bookedSlots.length, 'booking')}
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-zinc-400 font-medium">Loading departure schedule...</p>
            </div>
          ) : bookedSlots.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3 bg-white/40 dark:bg-zinc-900/40">
              <CalendarRange className="w-8 h-8 text-amber-500/60 mx-auto" />
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No student bookings yet</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto">
                When students select your open slots, their confirmed boarding pass tickets will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookedSlots.map((slot: AvailabilitySlot) => (
                <BoardingPassTicket
                  key={slot.id}
                  id={slot.id}
                  participantName={slot.booking?.student?.name || 'Student'}
                  participantRoleLabel="Student"
                  department={slot.booking?.student?.department}
                  email={slot.booking?.student?.email}
                  date={slot.date}
                  startTime={slot.startTime}
                  endTime={slot.endTime}
                  status="CONFIRMED"
                  onCancel={() => cancelMutation.mutate(slot.id)}
                  isCancelling={cancelMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Schedule Panel (Swaps cleanly between Calendar Grid & Compact List View) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                {viewMode === 'calendar' ? <Calendar className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </div>
              <span>{viewMode === 'calendar' ? 'Published Schedule Grid' : 'Listed Appointments'}</span>
            </h2>

            {/* Dynamic Animated View Toggle Pill */}
            <div className="flex bg-slate-200/80 dark:bg-zinc-900/80 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
              <button
                onClick={() => setViewMode('calendar')}
                className={`relative px-3.5 py-1.5 rounded-xl transition-colors duration-200 flex items-center space-x-1.5 ${
                  viewMode === 'calendar'
                    ? 'text-zinc-900 dark:text-white font-bold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {viewMode === 'calendar' && (
                  <motion.div
                    layoutId="activeViewTab"
                    className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Calendar className="w-3.5 h-3.5 text-amber-500 z-10" />
                <span className="z-10">Calendar</span>
              </button>

              <button
                onClick={() => setViewMode('list')}
                className={`relative px-3.5 py-1.5 rounded-xl transition-colors duration-200 flex items-center space-x-1.5 ${
                  viewMode === 'list'
                    ? 'text-zinc-900 dark:text-white font-bold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {viewMode === 'list' && (
                  <motion.div
                    layoutId="activeViewTab"
                    className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <List className="w-3.5 h-3.5 text-amber-500 z-10" />
                <span className="z-10">List View</span>
              </button>
            </div>
          </div>

          {/* Dynamic Content View Container */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-12 text-center"
              >
                <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-zinc-400 font-medium">Loading schedule...</p>
              </motion.div>
            ) : viewMode === 'calendar' ? (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <TimetableGrid
                  slots={slots}
                  mode="LECTURER"
                  onSelectEmptyCell={handleSelectEmptyCell}
                  onCancelSlot={(slotId) => cancelMutation.mutate(slotId)}
                  isActionPending={cancelMutation.isPending}
                />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm h-[540px] flex flex-col overflow-hidden"
              >
                {/* Sub-Filter Tabs Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 gap-2 flex-wrap">
                  <div className="flex items-center space-x-1.5 overflow-x-auto">
                    <button
                      onClick={() => setListFilter('ALL')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                        listFilter === 'ALL'
                          ? 'bg-amber-500 text-zinc-950 shadow-sm'
                          : 'bg-slate-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      All ({slots.length})
                    </button>
                    <button
                      onClick={() => setListFilter('BOOKED')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                        listFilter === 'BOOKED'
                          ? 'bg-amber-500 text-zinc-950 shadow-sm'
                          : 'bg-slate-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      Confirmed ({bookedSlots.length})
                    </button>
                    <button
                      onClick={() => setListFilter('OPEN')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                        listFilter === 'OPEN'
                          ? 'bg-amber-500 text-zinc-950 shadow-sm'
                          : 'bg-slate-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      Open ({openSlots.length})
                    </button>
                    <button
                      onClick={() => setListFilter('CANCELLED')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                        listFilter === 'CANCELLED'
                          ? 'bg-amber-500 text-zinc-950 shadow-sm'
                          : 'bg-slate-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      Cancelled ({cancelledSlots.length})
                    </button>
                  </div>
                </div>

                {/* Compact Scrollable List Content */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                  {filteredListSlots.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 bg-slate-50/50 dark:bg-zinc-950/50">
                      <CalendarRange className="w-6 h-6 text-amber-500/60 mx-auto" />
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">No matching slots</p>
                    </div>
                  ) : (
                    filteredListSlots.map((slot: AvailabilitySlot) => {
                      const isBooked = slot.status === 'BOOKED';
                      const isOpen = slot.status === 'OPEN';
                      const student = slot.booking?.student;

                      return (
                        <div
                          key={slot.id}
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                            isBooked
                              ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 shadow-sm'
                              : isOpen
                              ? 'bg-slate-50/80 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40 shadow-sm'
                              : 'bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-900 opacity-60'
                          }`}
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                <span>{slot.date}</span>
                              </div>
                              {slot.isRecurring && (
                                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[10px] font-bold uppercase tracking-wider">
                                  Recurring
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  isBooked
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    : isOpen
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                                }`}
                              >
                                {isBooked ? 'CONFIRMED' : slot.status}
                              </span>
                            </div>

                            {isBooked && student && (
                              <div className="flex items-center gap-2 pt-0.5">
                                <User className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                  {student.name}
                                </span>
                                {student.department && (
                                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                                    • {student.department}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                              <SplitFlapTime time={`${slot.startTime} - ${slot.endTime}`} size="sm" />
                            </div>
                          </div>

                          {(isOpen || isBooked) && (
                            <button
                              onClick={() => cancelMutation.mutate(slot.id)}
                              disabled={cancelMutation.isPending}
                              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:border-rose-400 dark:hover:border-rose-600 bg-transparent transition disabled:opacity-50 self-start sm:self-center"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}</span>
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Publish Availability Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-mono text-amber-500 font-bold tracking-wider">
                  DEPARTURE TIMETABLE
                </p>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Publish Availability
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 transition text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 transition text-sm"
                  />
                </div>
              </div>

              {/* Time Preview with SplitFlap */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Slot Preview:</span>
                <SplitFlapTime time={`${startTime} - ${endTime}`} size="sm" />
              </div>

              <div className="pt-1">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-white dark:focus:ring-offset-zinc-900"
                  />
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                    Repeat weekly for consecutive weeks
                  </span>
                </label>
              </div>

              {isRecurring && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Number of Weeks (1 - 12)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={recurringWeeks}
                    onChange={(e) => setRecurringWeeks(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 transition text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Publishing...' : 'Publish Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

