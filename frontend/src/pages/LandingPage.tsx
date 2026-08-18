import React from 'react';
import { Link } from 'react-router-dom';
import { ContainerScroll } from '../components/ui/container-scroll-animation';
import { GraduationCap, Calendar, ShieldCheck, Mail, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-gray-100 dark:bg-zinc-950 text-zinc-900 dark:text-white min-h-screen transition-colors duration-300">

      {/* Container Scroll Hero Section */}
      <ContainerScroll
        titleComponent={
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-widest">
              <GraduationCap className="w-4 h-4" />
              <span>Academic Office Hours Reimagined</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-4xl mx-auto leading-tight">
              Eliminate the guesswork of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600">
                Lecturer Availability
              </span>
            </h1>

            <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto font-medium">
              Publish consultation slots, browse faculty schedules by department, and secure instant double-booking-protected bookings with real-time email notifications.
            </p>

            <div className="flex items-center justify-center space-x-4 pt-4">
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 hover:scale-105 transition flex items-center space-x-2"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-sm transition shadow-sm"
              >
                Sign In
              </Link>
            </div>
          </div>
        }
      >
        {/* Mock UI Showcase inside ContainerScroll Card */}
        <div className="w-full h-full bg-white dark:bg-zinc-900 p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-mono text-zinc-400 dark:text-zinc-400 pl-2">knustconsult.edu.gh / dashboard</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-amber-600 dark:text-amber-400 font-semibold px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Live Monorepo System</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="text-xs text-amber-600 dark:text-amber-400 font-bold">DR. KWABENA MENSAH</div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">Computer Science</div>
              <div className="text-xs text-zinc-500">3 Open Slots Today</div>
              <div className="pt-2 flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Available 14:00 - 14:30
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="text-xs text-amber-600 dark:text-amber-400 font-bold">PROF. AMA SERWAA</div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">Electrical Engineering</div>
              <div className="text-xs text-zinc-500">Weekly Recurring Office Hours</div>
              <div className="pt-2 flex items-center text-xs text-amber-600 dark:text-amber-400 font-medium">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                Available 09:00 - 10:30
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="text-xs text-amber-600 dark:text-amber-400 font-bold">DR. YAW OSEI</div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">Mathematics &amp; Stats</div>
              <div className="text-xs text-zinc-500">2 Confirmed Student Sessions</div>
              <div className="pt-2 flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Booked by Kwame Appiah
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>🔒 Double-Booking Protection Enforced at Database Transaction Level</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">Nodemailer Local Fallback Active</span>
          </div>
        </div>
      </ContainerScroll>

      {/* Feature Highlights Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-zinc-200 dark:border-zinc-900 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white">Engineered for Academic Rigor</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
            A production-ready architecture designed for seamless lecturer management and student discovery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Atomic Double-Booking Locks</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Prisma transactions and unique database constraints prevent slot collisions even under heavy concurrent student requests.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Flexible Recurring Office Hours</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Lecturers can publish single dates or generate multi-week concrete slots with isolated service methods ready for v2 AI voice parsing.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Smart Email Notifications</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Nodemailer automatically dispatches confirmation &amp; cancellation emails to both parties, with zero-dependency offline console logging.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
