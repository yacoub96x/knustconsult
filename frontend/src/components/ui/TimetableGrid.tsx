import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Repeat, Clock, Plus, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { AvailabilitySlot } from '../../types';
import { SplitFlapTime } from './SplitFlapTime';

interface TimetableGridProps {
  slots: AvailabilitySlot[];
  mode: 'LECTURER' | 'STUDENT';
  lecturerName?: string;
  onSelectEmptyCell?: (date: string, startTime: string) => void;
  onCancelSlot?: (slotId: string) => void;
  onBookSlot?: (slotId: string) => void;
  isActionPending?: boolean;
}

// Helpers for Week Calculation
function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return new Date(date.setDate(diff));
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  slots,
  mode,
  lecturerName,
  onSelectEmptyCell,
  onCancelSlot,
  onBookSlot,
  isActionPending = false,
}) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedMobileDayIndex, setSelectedMobileDayIndex] = useState(0);

  // Modals & Popovers state
  const [slotToBook, setSlotToBook] = useState<AvailabilitySlot | null>(null);
  const [slotToCancel, setSlotToCancel] = useState<AvailabilitySlot | null>(null);
  const [slotDetailsView, setSlotDetailsView] = useState<AvailabilitySlot | null>(null);

  // Compute 7 days for current week offset
  const baseMonday = getMonday(new Date());
  baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(baseMonday);
    day.setDate(baseMonday.getDate() + i);
    const isoDate = formatDateISO(day);
    const dayName = day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const formattedShort = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { dayName, formattedShort, isoDate, rawDate: day };
  });

  // Extract unique times from published slots plus default hours
  const customSlotTimes = Array.from(new Set(slots.map(s => s.startTime)));
  const allTimeRows = Array.from(new Set([...DEFAULT_HOURS, ...customSlotTimes])).sort();

  // Index slots by `date_startTime`
  const slotMap = new Map<string, AvailabilitySlot>();
  slots.forEach(slot => {
    slotMap.set(`${slot.date}_${slot.startTime}`, slot);
  });

  const handleCellClick = (dayIso: string, time: string, slot?: AvailabilitySlot) => {
    if (slot) {
      if (slot.status === 'OPEN') {
        if (mode === 'STUDENT') {
          setSlotToBook(slot);
        } else if (mode === 'LECTURER') {
          setSlotToCancel(slot);
        }
      } else if (slot.status === 'BOOKED') {
        if (mode === 'LECTURER') {
          setSlotDetailsView(slot);
        }
      }
    } else {
      // Empty cell
      if (mode === 'LECTURER' && onSelectEmptyCell) {
        onSelectEmptyCell(dayIso, time);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-mono font-bold text-zinc-400 dark:text-zinc-500">
              WEEKLY TIMETABLE
            </p>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              {weekDays[0].formattedShort} – {weekDays[6].formattedShort}, {weekDays[0].rawDate.getFullYear()}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition shadow-sm"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setWeekOffset(0)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${weekOffset === 0
                ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-sm'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}
          >
            Current Week
          </button>

          <button
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition shadow-sm"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Day Selector Tabs */}
      <div className="flex sm:hidden overflow-x-auto pb-1 gap-1.5 scrollbar-none">
        {weekDays.map((day, idx) => (
          <button
            key={day.isoDate}
            onClick={() => setSelectedMobileDayIndex(idx)}
            className={`flex-1 min-w-[70px] py-2 px-1 rounded-xl border text-center transition ${selectedMobileDayIndex === idx
                ? 'bg-amber-500 text-zinc-950 border-amber-500 font-extrabold shadow-md'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
          >
            <p className="text-[10px] font-mono tracking-wider">{day.dayName}</p>
            <p className="text-xs font-bold">{day.formattedShort.split(' ')[1]}</p>
          </button>
        ))}
      </div>

      {/* Grid Container - Desktop (Full 7 columns) & Mobile (Selected day view) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">

        {/* Desktop Header Row */}
        <div className="hidden sm:grid grid-cols-8 border-b border-zinc-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/80">
          <div className="p-3 text-center text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
            TIME
          </div>
          {weekDays.map(day => (
            <div
              key={day.isoDate}
              className="p-3 text-center border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 space-y-0.5"
            >
              <span className="block text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {day.dayName}
              </span>
              <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {day.formattedShort}
              </span>
            </div>
          ))}
        </div>

        {/* Desktop Timetable Rows */}
        <div className="hidden sm:block divide-y divide-zinc-200 dark:divide-zinc-800">
          {allTimeRows.map(time => (
            <div key={time} className="grid grid-cols-8 min-h-[60px]">
              {/* Clean Text Time Label Column (No black & gold boxes!) */}
              <div className="p-2 border-r border-zinc-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 flex items-center justify-center">
                <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  {time}
                </span>
              </div>

              {/* Day Cells */}
              {weekDays.map(day => {
                const slotKey = `${day.isoDate}_${time}`;
                const slot = slotMap.get(slotKey);
                const isOpen = slot?.status === 'OPEN';
                const isBooked = slot?.status === 'BOOKED';
                const isCancelled = slot?.status === 'CANCELLED';

                return (
                  <div
                    key={day.isoDate}
                    onClick={() => handleCellClick(day.isoDate, time, slot)}
                    className={`p-2 border-r border-zinc-200/80 dark:border-zinc-800/80 last:border-r-0 flex flex-col justify-between transition-all ${!slot
                        ? mode === 'LECTURER'
                          ? 'hover:bg-amber-500/5 cursor-pointer group'
                          : 'bg-zinc-50/20 dark:bg-zinc-950/20'
                        : isOpen
                          ? mode === 'STUDENT' || mode === 'LECTURER'
                            ? 'bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-transparent hover:bg-amber-500/25 border-amber-500/40 cursor-pointer shadow-sm'
                            : 'bg-amber-500/10'
                          : isBooked
                            ? mode === 'LECTURER'
                              ? 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-transparent hover:bg-emerald-500/25 border-emerald-500/40 cursor-pointer shadow-sm'
                              : 'bg-emerald-500/10'
                            : 'bg-zinc-100/50 dark:bg-zinc-950/50 opacity-40 cursor-not-allowed'
                      }`}
                  >
                    {slot ? (
                      <div className="space-y-1.5 h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full ${isOpen
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                : isBooked
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700'
                              }`}
                          >
                            {slot.status}
                          </span>

                          {slot.isRecurring && (
                            <span className="p-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20" title="Recurring weekly slot">
                              <Repeat className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-semibold truncate">
                          {slot.startTime} - {slot.endTime}
                        </div>
                      </div>
                    ) : mode === 'LECTURER' ? (
                      <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          <Plus className="w-3 h-3" /> Add
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Mobile View (Selected Day Only) */}
        <div className="block sm:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
          {allTimeRows.map(time => {
            const currentDay = weekDays[selectedMobileDayIndex];
            const slotKey = `${currentDay.isoDate}_${time}`;
            const slot = slotMap.get(slotKey);
            const isOpen = slot?.status === 'OPEN';
            const isBooked = slot?.status === 'BOOKED';
            const isCancelled = slot?.status === 'CANCELLED';

            return (
              <div
                key={time}
                onClick={() => handleCellClick(currentDay.isoDate, time, slot)}
                className={`p-4 flex items-center justify-between transition-all ${!slot
                    ? mode === 'LECTURER'
                      ? 'hover:bg-amber-500/5 cursor-pointer'
                      : ''
                    : isOpen
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer'
                      : isBooked
                        ? mode === 'LECTURER'
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer'
                          : 'bg-emerald-500/10'
                        : 'bg-zinc-100/50 dark:bg-zinc-950/50 opacity-40'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    {time}
                  </span>
                  {slot && (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${isOpen
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : isBooked
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                            }`}
                        >
                          {slot.status}
                        </span>
                        {slot.isRecurring && (
                          <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-0.5">
                            <Repeat className="w-2.5 h-2.5" /> Recurring
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                  )}
                </div>

                {!slot && mode === 'LECTURER' && (
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Slot
                  </span>
                )}

                {slot && isOpen && mode === 'STUDENT' && (
                  <button className="px-3 py-1 rounded-lg bg-amber-500 text-zinc-950 text-xs font-bold shadow-sm">
                    Book
                  </button>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Confirmation Dialog: Student Booking Confirmation */}
      <AnimatePresence>
        {slotToBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-3 text-amber-500">
                <Clock className="w-6 h-6" />
                <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                  Confirm Booking
                </h4>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                <p className="text-zinc-500 dark:text-zinc-400">
                  Lecturer: <span className="font-bold text-zinc-900 dark:text-white">{lecturerName || 'Faculty Member'}</span>
                </p>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Date: <span className="font-bold text-zinc-900 dark:text-white">{slotToBook.date}</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 dark:text-zinc-400">Time:</span>
                  <SplitFlapTime time={`${slotToBook.startTime} - ${slotToBook.endTime}`} size="sm" />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => setSlotToBook(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onBookSlot) onBookSlot(slotToBook.id);
                    setSlotToBook(null);
                  }}
                  disabled={isActionPending}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {isActionPending ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog: Lecturer Cancel Slot */}
      <AnimatePresence>
        {slotToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-3 text-rose-500">
                <AlertCircle className="w-6 h-6" />
                <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                  Cancel Published Slot
                </h4>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Are you sure you want to cancel the slot on <span className="font-bold text-zinc-900 dark:text-white">{slotToCancel.date}</span> at <span className="font-bold text-zinc-900 dark:text-white">{slotToCancel.startTime} - {slotToCancel.endTime}</span>?
              </p>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => setSlotToCancel(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
                >
                  Keep Slot
                </button>
                <button
                  onClick={() => {
                    if (onCancelSlot) onCancelSlot(slotToCancel.id);
                    setSlotToCancel(null);
                  }}
                  disabled={isActionPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:border-rose-400 dark:hover:border-rose-600 bg-transparent transition disabled:opacity-50"
                >
                  {isActionPending ? 'Cancelling...' : 'Cancel Slot'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lecturer Inline View Student Details Modal */}
      <AnimatePresence>
        {slotDetailsView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle2 className="w-5 h-5" />
                  <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                    Booked Student Details
                  </h4>
                </div>
                <button
                  onClick={() => setSlotDetailsView(null)}
                  className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <p className="text-[10px] uppercase font-mono text-zinc-400 font-bold">Student Name</p>
                  <p className="text-sm font-extrabold text-zinc-900 dark:text-white">
                    {slotDetailsView.booking?.student?.name || 'Student Name N/A'}
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    {slotDetailsView.booking?.student?.department || 'Faculty N/A'} • {slotDetailsView.booking?.student?.email}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <p className="text-[10px] uppercase font-mono text-zinc-400 font-bold">Appointment Time</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{slotDetailsView.date}</span>
                    <SplitFlapTime time={`${slotDetailsView.startTime} - ${slotDetailsView.endTime}`} size="sm" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSlotDetailsView(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
