import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, Trash2, XCircle, User as UserIcon, Clock } from 'lucide-react';
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`relative flex rounded-2xl border shadow-sm transition-all overflow-hidden ${
        isConfirmed
          ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
          : 'bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-900 opacity-60'
      }`}
    >
      {/* Signature Left Accent Bar */}
      <div
        className={`w-[4px] flex-shrink-0 ${
          isConfirmed ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-700'
        }`}
      />

      <div className="flex-1 p-5 space-y-4 min-w-0">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              {participantRoleLabel} Consultation
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isConfirmed ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                CONFIRMED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">
                <XCircle className="w-3 h-3 text-zinc-400" />
                CANCELLED
              </span>
            )}
          </div>
        </div>

        {/* Participant Name & Details */}
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight truncate">
            {participantName}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 truncate">
            <UserIcon className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span>{department || 'KNUST Academic Dept'}</span>
            {email && <span className="hidden sm:inline text-zinc-400 dark:text-zinc-600 font-mono">• {email}</span>}
          </p>
        </div>

        {/* Date, Time & Action Button */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span className="font-mono">{date}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <SplitFlapTime time={`${startTime} - ${endTime}`} size="sm" />
            </div>
          </div>

          {onCancel && isConfirmed && (
            <button
              onClick={onCancel}
              disabled={isCancelling}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:border-rose-400 dark:hover:border-rose-600 bg-transparent transition disabled:opacity-50"
              title="Cancel appointment"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isCancelling ? 'Cancelling...' : 'Cancel'}</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
