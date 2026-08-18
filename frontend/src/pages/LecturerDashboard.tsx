import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { slotApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, Clock, User, Repeat, AlertCircle, CalendarRange } from 'lucide-react';
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
    // Calculate default end time 30 mins later
    const [h, m] = cellStartTime.split(':').map(Number);
    const endMinutes = h * 60 + m + 30;
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
    const endM = String(endMinutes % 60).padStart(2, '0');
    setEndTime(`${endH}:${endM}`);
    setShowModal(true);
  };

  const bookedSlots = slots.filter((s: AvailabilitySlot) => s.status === 'BOOKED');
  const openSlots   = slots.filter((s: AvailabilitySlot) => s.status === 'OPEN');

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
            LECTURER PORTAL • DEPARTURE CONTROL
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

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Confirmed Appointments (Boarding Pass Tickets) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-amber-500" />
              Confirmed Appointments
            </h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold font-mono tabular-nums">
              {plural(bookedSlots.length, 'booking')}
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-zinc-400">Loading departure schedule...</p>
            </div>
          ) : bookedSlots.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
              <CalendarRange className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mx-auto" />
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No student bookings yet</p>
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

        {/* Right Column: Weekly Timetable Grid */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              Published Schedule Grid
            </h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold font-mono tabular-nums">
              {plural(openSlots.length, 'open slot')}
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-zinc-400">Loading timetable grid...</p>
            </div>
          ) : (
            <TimetableGrid
              slots={slots}
              mode="LECTURER"
              onSelectEmptyCell={handleSelectEmptyCell}
              onCancelSlot={(slotId) => cancelMutation.mutate(slotId)}
              isActionPending={cancelMutation.isPending}
            />
          )}
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

