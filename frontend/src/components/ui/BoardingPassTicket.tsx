import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, Trash2, XCircle, User as UserIcon, Clock, AlertCircle } from 'lucide-react';
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
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING' | 'REJECTED';
  subject?: string | null;
  onCancel?: () => void;
  isCancelling?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
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
  subject,
  onCancel,
  isCancelling = false,
  onDelete,
  isDeleting = false,
}) => {
  const isConfirmed = status === 'CONFIRMED';
  const isPending   = status === 'PENDING';
  const isRejected  = status === 'REJECTED';
  const isCancelled = status === 'CANCELLED';

  // Left accent bar color
  const accentBar = isConfirmed
    ? 'bg-emerald-500'
    : isPending
      ? 'bg-amber-400'
      : isRejected
        ? 'bg-rose-400/60'
        : 'bg-zinc-400 dark:bg-zinc-700';

  // Card background / border
  const cardClass = isConfirmed
    ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
    : isPending
      ? 'bg-amber-500/5 dark:bg-amber-500/8 border-amber-300/60 dark:border-amber-500/30'
      : isRejected
        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40 opacity-75'
        : 'bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-900 opacity-55';

  // Status badge
  const StatusBadge = () => {
    if (isConfirmed) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          CONFIRMED
        </span>
      );
    }
    if (isPending) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-400/30">
          <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
          AWAITING APPROVAL
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-300/50 dark:border-rose-800/60">
          <XCircle className="w-3 h-3 text-rose-400" />
          DECLINED
        </span>
      );
    }
    // CANCELLED
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">
        <XCircle className="w-3 h-3 text-zinc-400" />
        CANCELLED
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`relative flex rounded-2xl border shadow-sm transition-all overflow-hidden ${cardClass}`}
    >
      {/* Signature Left Accent Bar */}
      <div className={`w-[4px] flex-shrink-0 ${accentBar}`} />

      <div className="flex-1 p-5 space-y-4 min-w-0">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              {participantRoleLabel} Consultation
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <StatusBadge />
          </div>
        </div>

        {/* Pending info note */}
        {isPending && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/20 text-[11px] text-amber-700 dark:text-amber-300">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
            <span>Your request has been sent and is awaiting the lecturer's decision.</span>
          </div>
        )}

        {/* Rejected info note */}
        {isRejected && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 text-[11px] text-rose-600 dark:text-rose-400">
            <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>This request was declined. The slot is open again — you may request another time.</span>
          </div>
        )}

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

        {/* Meeting Subject / Topic if present */}
        {subject && (
          <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 text-xs space-y-0.5">
            <p className="text-[10px] font-mono uppercase font-bold text-zinc-400 dark:text-zinc-500">
              Meeting Subject
            </p>
            <p className="text-zinc-800 dark:text-zinc-200 font-medium">
              {subject}
            </p>
          </div>
        )}

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

          <div className="flex items-center gap-2">
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

            {onDelete && (isCancelled || isRejected) && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-800 bg-transparent transition disabled:opacity-50"
                title="Delete record"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Record'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
