import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { slotApi, bookingApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, Clock, User, Repeat, AlertCircle, CalendarRange, GraduationCap, Ticket, Sparkles, List, Trash2, CheckCircle2, XCircle, Hourglass, ThumbsUp, ThumbsDown, Mic, MicOff, Loader2 } from 'lucide-react';
import { AvailabilitySlot, Booking } from '../types';
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
  const [listFilter, setListFilter] = useState<'ALL' | 'PENDING' | 'BOOKED' | 'OPEN' | 'CANCELLED'>('ALL');
  const [showModal, setShowModal] = useState(false);
  type DraftSlot = { id: string; date: string; startTime: string; endTime: string; isRecurring: boolean; recurringWeeks: number; };
  const getInitialDraft = (): DraftSlot => ({
    id: Math.random().toString(36).substring(7),
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '10:30',
    isRecurring: false,
    recurringWeeks: 4,
  });

  const [draftSlots, setDraftSlots] = useState<DraftSlot[]>([getInitialDraft()]);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isParsingVoice, setIsParsingVoice] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastSuccessMsg, setToastSuccessMsg] = useState<string | null>(null);
  const [toastErrorMsg, setToastErrorMsg] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

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

  const approveMutation = useMutation({
    mutationFn: bookingApi.approveBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-slots'] });
      setToastSuccessMsg('Booking approved — student has been notified!');
      setTimeout(() => setToastSuccessMsg(null), 4500);
    },
    onError: (err: any) => {
      setToastErrorMsg(err.message || 'Failed to approve booking');
      setTimeout(() => setToastErrorMsg(null), 4000);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: bookingApi.rejectBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-slots'] });
      setToastSuccessMsg('Request declined — slot is now open again.');
      setTimeout(() => setToastSuccessMsg(null), 4500);
    },
    onError: (err: any) => {
      setToastErrorMsg(err.message || 'Failed to reject booking');
      setTimeout(() => setToastErrorMsg(null), 4000);
    },
  });

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    for (const draft of draftSlots) {
      if (draft.startTime >= draft.endTime) {
        setFormError('End time must be after start time for all slots');
        return;
      }
    }
    try {
      for (const draft of draftSlots) {
        await createMutation.mutateAsync({
          date: draft.date,
          startTime: draft.startTime,
          endTime: draft.endTime,
          isRecurring: draft.isRecurring,
          recurringWeeks: Number(draft.recurringWeeks),
        });
      }
      setDraftSlots([getInitialDraft()]);
      setVoiceTranscript('');
    } catch (err: any) {
      // Error handled by mutation onError
    }
  };

  const processTextTranscript = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsParsingVoice(true);
    setFormError(null);
    try {
      const parsed = await slotApi.parseVoice(trimmed);
      if (parsed && parsed.length > 0) {
        const newDrafts = parsed.map((p: any) => ({
          id: Math.random().toString(36).substring(7),
          date: p.date,
          startTime: p.startTime,
          endTime: p.endTime,
          isRecurring: p.isRecurring || false,
          recurringWeeks: 4,
        }));
        setDraftSlots(newDrafts);
        setToastSuccessMsg('Successfully parsed your availability!');
        setTimeout(() => setToastSuccessMsg(null), 4000);
      } else {
        setFormError('Could not extract valid availability. Try e.g. "Available tomorrow 10am to 12pm"');
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Failed to parse voice input');
    } finally {
      setIsParsingVoice(false);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const handleVoiceInput = async () => {
    if (isListening) {
      stopAudioRecording();
      return;
    }

    setFormError(null);
    setVoiceTranscript('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setFormError('Microphone access is not supported in this browser. Please type your availability below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else if (MediaRecorder.isTypeSupported('audio/wav')) mimeType = 'audio/wav';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsListening(false);

        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          if (audioBlob.size > 500) {
            setIsParsingVoice(true);
            try {
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = async () => {
                const base64Data = (reader.result as string).split(',')[1];
                try {
                  const parsed = await slotApi.parseAudio(base64Data, mimeType);
                  if (parsed && parsed.length > 0) {
                    const newDrafts = parsed.map((p: any) => ({
                      id: Math.random().toString(36).substring(7),
                      date: p.date,
                      startTime: p.startTime,
                      endTime: p.endTime,
                      isRecurring: p.isRecurring || false,
                      recurringWeeks: 4,
                    }));
                    setDraftSlots(newDrafts);
                    setToastSuccessMsg('Successfully parsed your availability from voice audio!');
                    setTimeout(() => setToastSuccessMsg(null), 4000);
                  } else {
                    setFormError('Could not extract availability from audio. Try rephrasing or typing into the text box below.');
                  }
                } catch (err: any) {
                  setFormError(err.response?.data?.error || err.message || 'Failed to parse audio recording');
                } finally {
                  setIsParsingVoice(false);
                }
              };
            } catch (err: any) {
              setFormError('Failed to process recorded audio.');
              setIsParsingVoice(false);
            }
          }
        }
      };

      mediaRecorder.start(100);
      setIsListening(true);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;
          recognition.continuous = false;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((result: any) => result[0])
              .map((result) => result.transcript)
              .join('');
            setVoiceTranscript(transcript);
          };

          recognition.onerror = () => {
            // WebSpeech error silently ignored because MediaRecorder audio capture processes backend Gemini audio!
          };

          recognition.start();
        } catch (e) {}
      }
    } catch (err: any) {
      setIsListening(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setFormError('Microphone permission was denied by browser. Please click the lock/mic icon near your address bar to allow microphone access, or type below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setFormError('No microphone device found. Please check your audio hardware or type your availability in the text box.');
      } else {
        setFormError('Failed to access microphone: ' + (err.message || err.name));
      }
    }
  };

  const updateDraft = (id: string, updates: Partial<DraftSlot>) => {
    setDraftSlots(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };
  
  const removeDraft = (id: string) => {
    setDraftSlots(prev => prev.filter(s => s.id !== id));
  };
  
  const addDraft = () => {
    setDraftSlots(prev => [...prev, getInitialDraft()]);
  };

  const handleSelectEmptyCell = (cellDate: string, cellStartTime: string) => {
    const [h, m] = cellStartTime.split(':').map(Number);
    const endMinutes = h * 60 + m + 30;
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
    const endM = String(endMinutes % 60).padStart(2, '0');
    
    setDraftSlots([{
      id: Math.random().toString(36).substring(7),
      date: cellDate,
      startTime: cellStartTime,
      endTime: `${endH}:${endM}`,
      isRecurring: false,
      recurringWeeks: 4,
    }]);
    setShowModal(true);
  };

  const bookedSlots    = slots.filter((s: AvailabilitySlot) => s.status === 'BOOKED');
  const openSlots      = slots.filter((s: AvailabilitySlot) => s.status === 'OPEN');
  const pendingSlots   = slots.filter((s: AvailabilitySlot) => s.status === 'PENDING');
  const cancelledSlots = slots.filter((s: AvailabilitySlot) => s.status === 'CANCELLED');

  const filteredListSlots = slots.filter((s: AvailabilitySlot) => {
    if (listFilter === 'BOOKED')    return s.status === 'BOOKED';
    if (listFilter === 'OPEN')      return s.status === 'OPEN';
    if (listFilter === 'PENDING')   return s.status === 'PENDING';
    if (listFilter === 'CANCELLED') return s.status === 'CANCELLED';
    return true;
  });

  const isAnyActionPending = approveMutation.isPending || rejectMutation.isPending || cancelMutation.isPending;

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
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 tabular-nums flex items-center gap-2 flex-wrap">
              {pendingSlots.length > 0 && (
                <>
                  <span className="flex items-center gap-1">
                    <Hourglass className="w-3.5 h-3.5 text-violet-500" />
                    <span className="font-semibold text-violet-600 dark:text-violet-400">{pendingSlots.length}</span>
                    {' '}{pendingSlots.length === 1 ? 'pending request' : 'pending requests'}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                </>
              )}
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
          onClick={() => {
            setDraftSlots([getInitialDraft()]);
            setVoiceTranscript('');
            setFormError(null);
            setShowModal(true);
          }}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Publish Availability</span>
        </button>
      </div>

      {/* ─── Pending Requests Banner ─── */}
      <AnimatePresence>
        {!isLoading && pendingSlots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-500/20 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-violet-900 dark:text-violet-100 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-violet-500/15 border border-violet-400/30 text-violet-500 flex items-center justify-center">
                  <Hourglass className="w-4 h-4" />
                </div>
                Pending Requests
              </h2>
              <span className="text-xs font-mono font-bold text-violet-700 dark:text-violet-300 bg-violet-500/10 border border-violet-400/30 px-2.5 py-1 rounded-full">
                {plural(pendingSlots.length, 'request')} awaiting decision
              </span>
            </div>

            <div className="space-y-3">
              {pendingSlots.map((slot: AvailabilitySlot) => {
                const student = slot.booking?.student;
                const bookingId = slot.booking?.id;
                return (
                  <div
                    key={slot.id}
                    className="bg-white dark:bg-zinc-900 border border-violet-200/60 dark:border-violet-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-1.5 min-w-0">
                      {/* Student info */}
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                        <span className="text-sm font-extrabold text-zinc-900 dark:text-white truncate">
                          {student?.name || 'Student'}
                        </span>
                        {student?.department && (
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                            • {student.department}
                          </span>
                        )}
                      </div>
                      {student?.email && (
                        <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 truncate">
                          {student.email}
                        </p>
                      )}
                      {slot.booking?.subject && (
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md inline-block max-w-full truncate">
                          Subject: {slot.booking.subject}
                        </p>
                      )}
                      {/* Time */}
                      <div className="flex items-center gap-3 pt-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{slot.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                          <SplitFlapTime time={`${slot.startTime} - ${slot.endTime}`} size="sm" />
                        </div>
                      </div>
                    </div>

                    {/* Approve / Decline actions */}
                    {bookingId && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => rejectMutation.mutate(bookingId)}
                          disabled={isAnyActionPending}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:border-rose-400 bg-transparent transition disabled:opacity-50"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          Decline
                        </button>
                        <button
                          onClick={() => approveMutation.mutate(bookingId)}
                          disabled={isAnyActionPending}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No confirmed bookings yet</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto">
                Approved student requests will appear here as confirmed boarding pass tickets.
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
                  subject={slot.booking?.subject}
                  status="CONFIRMED"
                  onCancel={() => cancelMutation.mutate(slot.id)}
                  isCancelling={cancelMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Schedule Panel */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                {viewMode === 'calendar' ? <Calendar className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </div>
              <span>{viewMode === 'calendar' ? 'Published Schedule Grid' : 'Listed Appointments'}</span>
            </h2>

            {/* Animated View Toggle Pill */}
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

          {/* Dynamic Content View */}
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
                  onApproveBooking={(bookingId) => approveMutation.mutate(bookingId)}
                  onRejectBooking={(bookingId) => rejectMutation.mutate(bookingId)}
                  isActionPending={isAnyActionPending}
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
                {/* Filter Tabs */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 gap-2 flex-wrap">
                  <div className="flex items-center space-x-1.5 overflow-x-auto">
                    {([
                      { key: 'ALL',       label: `All (${slots.length})` },
                      { key: 'PENDING',   label: `Pending (${pendingSlots.length})` },
                      { key: 'BOOKED',    label: `Confirmed (${bookedSlots.length})` },
                      { key: 'OPEN',      label: `Open (${openSlots.length})` },
                      { key: 'CANCELLED', label: `Cancelled (${cancelledSlots.length})` },
                    ] as const).map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setListFilter(tab.key)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                          listFilter === tab.key
                            ? tab.key === 'PENDING'
                              ? 'bg-violet-500 text-white shadow-sm'
                              : 'bg-amber-500 text-zinc-950 shadow-sm'
                            : 'bg-slate-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrollable Slot List */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                  {filteredListSlots.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 bg-slate-50/50 dark:bg-zinc-950/50">
                      <CalendarRange className="w-6 h-6 text-amber-500/60 mx-auto" />
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">No matching slots</p>
                    </div>
                  ) : (
                    filteredListSlots.map((slot: AvailabilitySlot) => {
                      const isBooked    = slot.status === 'BOOKED';
                      const isOpen      = slot.status === 'OPEN';
                      const isPending   = slot.status === 'PENDING';
                      const student     = slot.booking?.student;
                      const bookingId   = slot.booking?.id;

                      return (
                        <div
                          key={slot.id}
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                            isPending
                              ? 'bg-violet-50/80 dark:bg-violet-950/20 border-violet-300/50 dark:border-violet-500/20'
                              : isBooked
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
                                  isPending
                                    ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-400/30'
                                    : isBooked
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    : isOpen
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                                }`}
                              >
                                {isPending ? 'PENDING' : isBooked ? 'CONFIRMED' : slot.status}
                              </span>
                            </div>

                            {(isBooked || isPending) && student && (
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

                          {/* Pending: Approve + Decline */}
                          {isPending && bookingId && (
                            <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                              <button
                                onClick={() => rejectMutation.mutate(bookingId)}
                                disabled={isAnyActionPending}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 hover:border-rose-400 bg-transparent transition disabled:opacity-50"
                              >
                                <ThumbsDown className="w-3 h-3" /> Decline
                              </button>
                              <button
                                onClick={() => approveMutation.mutate(bookingId)}
                                disabled={isAnyActionPending}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                              >
                                <ThumbsUp className="w-3 h-3" /> Approve
                              </button>
                            </div>
                          )}

                          {/* Open or Booked: Cancel */}
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
                onClick={() => { stopAudioRecording(); setShowModal(false); }}
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

            {/* Voice & Text Input Section */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-500/20 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    AI Voice & Text Parsing
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Speak or type your availability naturally (e.g. "Tomorrow 10am to 12pm").
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  disabled={isParsingVoice}
                  title={isListening ? "Click to stop listening" : "Click to start voice recognition"}
                  className={`relative overflow-hidden flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-4 ring-rose-500/20'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-amber-500 hover:text-amber-500 shadow-sm'
                  } ${isParsingVoice ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isListening ? (
                    <>
                      <span className="absolute inset-0 rounded-full animate-ping bg-rose-500 opacity-20"></span>
                      <MicOff className="w-4 h-4" />
                    </>
                  ) : isParsingVoice ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={voiceTranscript}
                  onChange={(e) => setVoiceTranscript(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      processTextTranscript(voiceTranscript);
                    }
                  }}
                  placeholder={isListening ? "Listening... speak now..." : "e.g. Tomorrow from 2pm to 4pm every week"}
                  className="flex-1 px-3.5 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => processTextTranscript(voiceTranscript)}
                  disabled={isParsingVoice || !voiceTranscript.trim()}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-500 text-zinc-950 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm flex-shrink-0"
                >
                  {isParsingVoice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Parse AI
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-4">
              <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-4">
                {draftSlots.map((draft, index) => (
                  <div key={draft.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-4 relative">
                    {draftSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDraft(draft.id)}
                        className="absolute -top-2 -right-2 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 p-1.5 rounded-full hover:bg-rose-200 transition shadow-sm"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                        Date {draftSlots.length > 1 ? `#${index + 1}` : ''}
                      </label>
                      <input
                        type="date"
                        required
                        value={draft.date}
                        onChange={(e) => updateDraft(draft.id, { date: e.target.value })}
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
                          value={draft.startTime}
                          onChange={(e) => updateDraft(draft.id, { startTime: e.target.value })}
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
                          value={draft.endTime}
                          onChange={(e) => updateDraft(draft.id, { endTime: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 transition text-sm"
                        />
                      </div>
                    </div>

                    <div className="pt-1">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.isRecurring}
                          onChange={(e) => updateDraft(draft.id, { isRecurring: e.target.checked })}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-white dark:focus:ring-offset-zinc-900"
                        />
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                          Repeat weekly for consecutive weeks
                        </span>
                      </label>
                    </div>

                    {draft.isRecurring && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                          Number of Weeks (1 - 12)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={draft.recurringWeeks}
                          onChange={(e) => updateDraft(draft.id, { recurringWeeks: Number(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 transition text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addDraft}
                className="w-full py-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" /> Add another slot manually
              </button>

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
