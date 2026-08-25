import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lecturerApi, bookingApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Search, Calendar, UserCheck, Building, ChevronRight, CalendarRange, Clock, Hourglass } from 'lucide-react';
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

  // Book slot mutation — now creates a PENDING request
  const bookMutation = useMutation({
    mutationFn: ({ slotId, subject }: { slotId: string; subject?: string }) => bookingApi.bookSlot(slotId, subject),
    onSuccess: (data) => {
      const lecturerName = data.booking?.slot?.lecturer?.name || selectedLecturer?.name || 'Lecturer';
      // "Request sent" — not "confirmed" — because booking is now PENDING
      setToastSuccessMsg(`Request sent to ${lecturerName} — awaiting their approval!`);
      setToastErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['lecturer-slots', selectedLecturer?.id] });
      queryClient.invalidateQueries({ queryKey: ['lecturers'] });
      setTimeout(() => setToastSuccessMsg(null), 5000);
    },
    onError: (err: any) => {
      setToastErrorMsg(err.message || 'Failed to submit request');
      setToastSuccessMsg(null);
      setTimeout(() => setToastErrorMsg(null), 5000);
    },
  });

  // Cancel booking mutation (only works for CONFIRMED bookings — enforced server-side)
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

  // Delete cancelled/declined booking record mutation
  const deleteCancelledBookingMutation = useMutation({
    mutationFn: (bookingId: string) => bookingApi.deleteCancelledBooking(bookingId),
    onSuccess: () => {
      setToastSuccessMsg('Cancelled appointment record deleted.');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setTimeout(() => setToastSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setToastErrorMsg(err.message || 'Failed to delete record');
      setTimeout(() => setToastErrorMsg(null), 4000);
    },
  });

  // Categorise bookings by status
  const confirmedBookings = myBookings.filter((b: Booking) => b.status === 'CONFIRMED');
  const pendingBookings   = myBookings.filter((b: Booking) => b.status === 'PENDING');
  const rejectedBookings  = myBookings.filter((b: Booking) => b.status === 'REJECTED');
  const cancelledBookings = myBookings.filter((b: Booking) => b.status === 'CANCELLED');

  // Active count for header stat (confirmed + pending are "active" in the broad sense)
  const activeCount = confirmedBookings.length + pendingBookings.length;

  // All slots from the selected lecturer (backend returns OPEN, PENDING, BOOKED)
  const allSlots: AvailabilitySlot[] = slotData?.slots || [];
  // Only OPEN slots shown in the list view (PENDING/BOOKED already blocked visually in the grid)
  const openAvailableSlots = allSlots.filter((s: AvailabilitySlot) => s.status === 'OPEN');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Floating Viewport Toast System */}
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
            STUDENT PORTAL • CONSULTATION BOOKING
          </p>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
            {user?.name}
          </h1>
          {!loadingBookings && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 tabular-nums font-mono flex items-center gap-2 flex-wrap">
              {confirmedBookings.length > 0 && (
                <span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">{confirmedBookings.length}</span>
                  {' '}{confirmedBookings.length === 1 ? 'confirmed consultation' : 'confirmed consultations'}
                </span>
              )}
              {pendingBookings.length > 0 && (
                <>
                  {confirmedBookings.length > 0 && <span className="text-zinc-300 dark:text-zinc-700">•</span>}
                  <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                    <Hourglass className="w-3.5 h-3.5" />
                    <span className="font-semibold">{pendingBookings.length}</span>
                    {' '}{pendingBookings.length === 1 ? 'pending request' : 'pending requests'}
                  </span>
                </>
              )}
              {confirmedBookings.length === 0 && pendingBookings.length === 0 && (
                <span>No active bookings</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: My Bookings */}
        <div className="lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              My Consultations
            </h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold font-mono tabular-nums">
              {plural(activeCount, 'active')}
            </span>
          </div>

          {loadingBookings ? (
            <div className="p-12 text-center">
              <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-zinc-400 font-medium">Retrieving your consultation tickets...</p>
            </div>
          ) : confirmedBookings.length === 0 && pendingBookings.length === 0 && cancelledBookings.length === 0 && rejectedBookings.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3 bg-white/40 dark:bg-zinc-900/40">
              <CalendarRange className="w-8 h-8 text-amber-500/60 mx-auto" />
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No bookings yet</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto">
                Select a lecturer on the right to browse their timetable and submit a consultation request.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pending Requests — distinct amber/violet treatment */}
              {pendingBookings.map((b: Booking) => (
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
                  subject={b.subject}
                  status="PENDING"
                />
              ))}

              {/* Confirmed Active Boarding Pass Tickets */}
              {confirmedBookings.map((b: Booking) => (
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
                  subject={b.subject}
                  status="CONFIRMED"
                  onCancel={() => cancelBookingMutation.mutate(b.id)}
                  isCancelling={cancelBookingMutation.isPending}
                />
              ))}

              {/* Rejected Bookings */}
              {rejectedBookings.map((b: Booking) => (
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
                  subject={b.subject}
                  status="REJECTED"
                  onDelete={() => deleteCancelledBookingMutation.mutate(b.id)}
                  isDeleting={deleteCancelledBookingMutation.isPending}
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
                  subject={b.subject}
                  status="CANCELLED"
                  onDelete={() => deleteCancelledBookingMutation.mutate(b.id)}
                  isDeleting={deleteCancelledBookingMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Browse Lecturers & Timetable Grid */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              Faculty Directory
            </h2>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or dept..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500 transition shadow-sm"
              />
            </div>
          </div>

          {/* Lecturers Cards List */}
          {loadingLecturers ? (
            <div className="p-12 text-center">
              <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-zinc-400 font-medium">Searching faculty directory...</p>
            </div>
          ) : lecturers.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-2 bg-white/40 dark:bg-zinc-900/40">
              <Building className="w-7 h-7 text-zinc-400 dark:text-zinc-600 mx-auto" />
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No lecturers found</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto">
                Try adjusting your search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {lecturers.map((lecturer: User) => {
                const isSelected = selectedLecturer?.id === lecturer.id;
                const openCount = lecturer._count?.slots || 0;

                return (
                  <button
                    key={lecturer.id}
                    onClick={() => setSelectedLecturer(lecturer)}
                    className={`relative flex rounded-2xl border overflow-hidden text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/50 shadow-sm'
                        : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-amber-500/30 hover:shadow-sm'
                    }`}
                  >
                    {/* Left edge bar */}
                    <div
                      className={`w-[4px] flex-shrink-0 ${
                        isSelected
                          ? 'bg-amber-500'
                          : openCount > 0
                          ? 'bg-amber-500'
                          : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    />

                    <div className="flex-1 p-4 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-extrabold text-zinc-900 dark:text-white text-sm tracking-tight">
                            {lecturer.name}
                          </h3>
                          <ChevronRight className={`w-4 h-4 flex-shrink-0 transition ${isSelected ? 'text-amber-500 translate-x-0.5' : 'text-zinc-400'}`} />
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5 font-medium">
                          <Building className="w-3.5 h-3.5 text-zinc-400" />
                          {lecturer.department || 'General Faculty'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-xs gap-2">
                        <span className="text-zinc-400 dark:text-zinc-500 truncate max-w-[130px] font-mono text-[11px]">{lecturer.email}</span>
                        <span
                          className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded-full ${
                            openCount > 0
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
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
            <div className="mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl space-y-6 shadow-xl shadow-amber-500/5 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest font-mono">
                      FACULTY TIMETABLE SCHEDULE
                    </p>
                  </div>
                  <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5">
                    {selectedLecturer.name}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3.5 py-1.5 rounded-xl transition ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-bold'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      Weekly Grid
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3.5 py-1.5 rounded-xl transition ${
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
                    className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-3 py-2 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 transition font-bold"
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
                /* Weekly Grid View — passes all slots (OPEN, PENDING, BOOKED) */
                <TimetableGrid
                  slots={allSlots}
                  mode="STUDENT"
                  lecturerName={selectedLecturer.name}
                  onBookSlot={(slotId, subject) => bookMutation.mutate({ slotId, subject })}
                  isActionPending={bookMutation.isPending}
                />
              ) : (
                /* Available Slots List View — shows only OPEN slots */
                openAvailableSlots.length === 0 ? (
                  <div className="p-8 text-center space-y-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/50">
                    <Clock className="w-6 h-6 text-zinc-400 dark:text-zinc-600 mx-auto" />
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                      No open slots available right now
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto">
                      All published slots for this lecturer are currently booked or pending approval.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3.5">
                    {openAvailableSlots.map((slot: AvailabilitySlot) => (
                      <div
                        key={slot.id}
                        className="bg-slate-50/80 dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800/90 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-500/40 hover:shadow-md transition-all group"
                      >
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{slot.date}</span>
                            </div>
                            {slot.isRecurring && (
                              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[10px] font-bold uppercase tracking-wider">
                                Recurring Weekly
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-0.5">
                            <Clock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                            <SplitFlapTime time={`${slot.startTime} - ${slot.endTime}`} size="sm" />
                          </div>
                        </div>

                        <button
                          onClick={() => bookMutation.mutate({ slotId: slot.id })}
                          disabled={bookMutation.isPending}
                          className="whitespace-nowrap flex-shrink-0 inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Request Slot</span>
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
