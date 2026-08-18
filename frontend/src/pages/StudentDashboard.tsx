import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lecturerApi, bookingApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Search, Calendar, UserCheck, Building, ChevronRight, CalendarRange, Clock } from 'lucide-react';
import { User, AvailabilitySlot, Booking } from '../types';
import { BoardingPassTicket } from '../components/ui/BoardingPassTicket';
import { TimetableGrid } from '../components/ui/TimetableGrid';
import { FloatingToast } from '../components/ui/FloatingToast';
import { SplitFlapTime } from '../components/ui/SplitFlapTime';

/** Returns "1 booking" / "2 bookings" etc. */
function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLecturer, setSelectedLecturer] = useState<User | null>(null);
  const [toastSuccessMsg, setToastSuccessMsg] = useState<string | null>(null);
  const [toastErrorMsg, setToastErrorMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch lecturers list query
  const { data: lecturers = [], isLoading: loadingLecturers } = useQuery({
    queryKey: ['lecturers', searchTerm],
    queryFn: () => lecturerApi.getLecturers(searchTerm),
  });

  // Fetch slots for selected lecturer query
  const { data: slotData, isLoading: loadingSlots } = useQuery({
    queryKey: ['lecturer-slots', selectedLecturer?.id],
    queryFn: () => (selectedLecturer ? lecturerApi.getLecturerSlots(selectedLecturer.id) : null),
    enabled: !!selectedLecturer,
  });

  // Fetch student's own bookings query
  const { data: myBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingApi.getMyBookings,
  });

  // Book slot mutation
  const bookMutation = useMutation({
    mutationFn: (slotId: string) => bookingApi.bookSlot(slotId),
    onSuccess: (data) => {
      const lecturerName = data.booking?.slot?.lecturer?.name || selectedLecturer?.name || 'Lecturer';
      setToastSuccessMsg(`Consultation confirmed with ${lecturerName} for ${data.booking?.slot?.date || 'selected date'}!`);
      setToastErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['lecturer-slots', selectedLecturer?.id] });
      queryClient.invalidateQueries({ queryKey: ['lecturers'] });
      setTimeout(() => setToastSuccessMsg(null), 5000);
    },
    onError: (err: any) => {
      setToastErrorMsg(err.message || 'Failed to book slot');
      setToastSuccessMsg(null);
      setTimeout(() => setToastErrorMsg(null), 5000);
    },
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId: string) => bookingApi.cancelBooking(bookingId),
    onSuccess: () => {
      setToastSuccessMsg('Booking cancelled successfully.');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['lecturer-slots'] });
      queryClient.invalidateQueries({ queryKey: ['lecturers'] });
      setTimeout(() => setToastSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setToastErrorMsg(err.message || 'Failed to cancel booking');
      setTimeout(() => setToastErrorMsg(null), 4000);
    },
  });

  const activeBookings = myBookings.filter((b: Booking) => b.status === 'CONFIRMED');
  const cancelledBookings = myBookings.filter((b: Booking) => b.status === 'CANCELLED');

  // Filter slots for student available list: ONLY include OPEN slots (exclude booked/cancelled)
  const allSlots: AvailabilitySlot[] = slotData?.slots || [];
  const openAvailableSlots = allSlots.filter((s: AvailabilitySlot) => s.status === 'OPEN');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Floating Viewport Toast System (Always visible regardless of scroll position) */}
      <FloatingToast
        successMsg={toastSuccessMsg}
        errorMsg={toastErrorMsg}
        onCloseSuccess={() => setToastSuccessMsg(null)}
        onCloseError={() => setToastErrorMsg(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest font-mono font-bold text-zinc-400 dark:text-zinc-500">
            STUDENT PORTAL • TRANSIT DESK
          </p>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
            {user?.name}
          </h1>
          {!loadingBookings && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 tabular-nums font-mono">
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">{activeBookings.length}</span>
              {' '}{activeBookings.length === 1 ? 'active consultation ticket' : 'active consultation tickets'}
            </p>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: My Booked Consultations (Boarding Pass Tickets) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              My Boarding Tickets
            </h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold font-mono tabular-nums">
              {plural(activeBookings.length, 'ticket')}
            </span>
          </div>

          {loadingBookings ? (
            <div className="p-12 text-center">
              <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-zinc-400">Retrieving your consultation tickets...</p>
            </div>
          ) : activeBookings.length === 0 && cancelledBookings.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
              <CalendarRange className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mx-auto" />
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No active bookings</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto">
                Select a lecturer on the right to view timetable availability and book a consultation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Confirmed Active Boarding Pass Tickets */}
              {activeBookings.map((b: Booking) => (
                <BoardingPassTicket
                  key={b.id}
                  id={b.id}
                  participantName={b.slot?.lecturer?.name || 'Lecturer'}
                  participantRoleLabel="Lecturer"
                  department={b.slot?.lecturer?.department}
                  email={b.slot?.lecturer?.email}
                  date={b.slot?.date || ''}
                  startTime={b.slot?.startTime || ''}
                  endTime={b.slot?.endTime || ''}
                  status="CONFIRMED"
                  onCancel={() => cancelBookingMutation.mutate(b.id)}
                  isCancelling={cancelBookingMutation.isPending}
                />
              ))}

              {/* Muted Cancelled Boarding Pass Tickets */}
              {cancelledBookings.map((b: Booking) => (
                <BoardingPassTicket
                  key={b.id}
                  id={b.id}
                  participantName={b.slot?.lecturer?.name || 'Lecturer'}
                  participantRoleLabel="Lecturer"
                  department={b.slot?.lecturer?.department}
                  email={b.slot?.lecturer?.email}
                  date={b.slot?.date || ''}
                  startTime={b.slot?.startTime || ''}
                  endTime={b.slot?.endTime || ''}
                  status="CANCELLED"
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Browse Lecturers & Timetable Grid */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-500" />
              Lecturer Directory
            </h2>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or dept..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500 transition font-mono"
              />
            </div>
          </div>

          {/* Lecturers Cards List */}
          {loadingLecturers ? (
            <div className="p-12 text-center">
              <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-zinc-400">Searching lecturer directory...</p>
            </div>
          ) : lecturers.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
              <Building className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mx-auto" />
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No lecturers found</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto">
                Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lecturers.map((lecturer: User) => {
                const isSelected = selectedLecturer?.id === lecturer.id;
                const openCount = lecturer._count?.slots || 0;

                return (
                  <button
                    key={lecturer.id}
                    onClick={() => setSelectedLecturer(lecturer)}
                    className={`relative flex rounded-xl border overflow-hidden text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500 ring-1 ring-amber-500 shadow-md'
                        : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {/* Signature left-edge bar */}
                    <div
                      className={`w-[3px] flex-shrink-0 ${
                        isSelected
                          ? 'bg-amber-500'
                          : openCount > 0
                          ? 'bg-emerald-500'
                          : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    />

                    <div className="flex-1 p-4 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-zinc-900 dark:text-white text-sm">
                            {lecturer.name}
                          </h3>
                          <ChevronRight className={`w-4 h-4 flex-shrink-0 transition ${isSelected ? 'text-amber-500 translate-x-0.5' : 'text-zinc-400'}`} />
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                          <Building className="w-3 h-3 text-zinc-400" />
                          {lecturer.department || 'General Faculty'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs gap-2">
                        <span className="text-zinc-400 dark:text-zinc-500 truncate max-w-[130px] font-mono">{lecturer.email}</span>
                        <span
                          className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                            openCount > 0
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          {openCount} {openCount === 1 ? 'Open Slot' : 'Open Slots'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Lecturer Slots & Timetable Section */}
          {selectedLecturer && (
            <div className="mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-5 shadow-xl transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 gap-3">
                <div>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider font-mono">
                    DEPARTURE TIMETABLE
                  </p>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    {selectedLecturer.name}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-1 rounded-lg transition ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-bold'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      Weekly Grid
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1 rounded-lg transition ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-bold'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      Available List
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedLecturer(null)}
                    className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-2.5 py-1.5 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 transition font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>

              {loadingSlots ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">Loading timetable...</p>
                </div>
              ) : viewMode === 'grid' ? (
                /* Weekly Grid View */
                <TimetableGrid
                  slots={allSlots}
                  mode="STUDENT"
                  lecturerName={selectedLecturer.name}
                  onBookSlot={(slotId) => bookMutation.mutate(slotId)}
                  isActionPending={bookMutation.isPending}
                />
              ) : (
                /* Available Consultation Slots List View (EXCLUDES already booked slots!) */
                openAvailableSlots.length === 0 ? (
                  <div className="p-8 text-center space-y-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <Clock className="w-6 h-6 text-zinc-400 dark:text-zinc-600 mx-auto" />
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      No open slots available right now
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      All published slots for this lecturer are currently booked or unavailable.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {openAvailableSlots.map((slot: AvailabilitySlot) => (
                      <div
                        key={slot.id}
                        className="bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:border-amber-500/40 transition group"
                      >
                        <div className="space-y-1.5">
                          <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                            {slot.date}
                          </div>
                          <div className="flex items-center gap-2">
                            <SplitFlapTime time={`${slot.startTime} - ${slot.endTime}`} size="sm" />
                          </div>
                        </div>

                        <button
                          onClick={() => bookMutation.mutate(slot.id)}
                          disabled={bookMutation.isPending}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition disabled:opacity-50"
                        >
                          Book Ticket
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

