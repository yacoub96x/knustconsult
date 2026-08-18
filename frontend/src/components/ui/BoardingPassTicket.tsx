import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, Trash2, XCircle, Plane, User as UserIcon } from 'lucide-react';
import { SplitFlapTime } from './SplitFlapTime';

interface BoardingPassTicketProps {
  id: string;
  participantName: string;
  participantRoleLabel: string; // e.g. "Student" or "Lecturer"
  department?: string | null;
  email?: string | null;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'CONFIRMED' | 'CANCELLED';
  onCancel?: () => void;
  isCancelling?: boolean;
}

export const BoardingPassTicket: React.FC<BoardingPassTicketProps> = ({
  id,
  participantName,
  participantRoleLabel,
  department,
  email,
  date,
  startTime,
  endTime,
  status,
  onCancel,
  isCancelling = false,
}) => {
  const isConfirmed = status === 'CONFIRMED';
  const shortRef = `KC-${id.substring(0, 6).toUpperCase()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`relative group flex flex-col sm:flex-row rounded-2xl border shadow-sm transition-all overflow-hidden ${
        isConfirmed
          ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 hover:shadow-md'
          : 'bg-zinc-100/70 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800/80 opacity-60'
      }`}
    >
      {/* Signature Left Status Indicator Bar */}
      <div
        className={`w-full sm:w-[5px] h-[4px] sm:h-auto flex-shrink-0 ${
          isConfirmed ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-700'
        }`}
      />

      {/* Main Ticket Body */}
      <div className="flex-1 p-5 space-y-4 min-w-0">
        {/* Top Header Tag */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
              <Plane className="w-3 h-3 text-amber-500" />
              BOARDING PASS
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
              {participantRoleLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isConfirmed ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                CONFIRMED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">
                <XCircle className="w-3 h-3 text-zinc-400" />
                CANCELLED
              </span>
            )}
          </div>
        </div>

        {/* Participant & Department Information */}
        <div className="space-y-0.5">
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight truncate">
            {participantName}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 truncate">
            <UserIcon className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span>{department || 'KNUST Academic Dept'}</span>
            {email && <span className="hidden sm:inline text-zinc-400 dark:text-zinc-600">• {email}</span>}
          </p>
        </div>

        {/* Date & Split-Flap Time Display Row */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span className="font-mono">{date}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
              TIME:
            </span>
            <SplitFlapTime time={`${startTime} - ${endTime}`} size="sm" />
          </div>
        </div>
      </div>

      {/* Ticket Cutout Notch Seam */}
      <div className="relative hidden sm:flex flex-col justify-between items-center w-0 my-[-1px]">
        <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 -mt-2 -ml-2 z-10" />
        <div className="h-full border-r-2 border-dashed border-zinc-200 dark:border-zinc-800/80" />
        <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 -mb-2 -ml-2 z-10" />
      </div>

      {/* Horizontal seam divider on mobile screens */}
      <div className="relative flex sm:hidden items-center justify-between h-0 mx-[-1px]">
        <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 -ml-2 z-10" />
        <div className="w-full border-b-2 border-dashed border-zinc-200 dark:border-zinc-800/80" />
        <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 -mr-2 z-10" />
      </div>

      {/* Stub Section */}
      <div className="w-full sm:w-40 bg-zinc-50/80 dark:bg-zinc-950/80 p-4 flex flex-row sm:flex-col items-center justify-between gap-3 text-center sm:text-left font-mono">
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
            TICKET REF
          </p>
          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 tracking-wider">
            {shortRef}
          </p>
        </div>

        {onCancel && isConfirmed && (
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition disabled:opacity-50"
            title="Cancel consultation ticket"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isCancelling ? 'Cancelling...' : 'Cancel'}</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};
