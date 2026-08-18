import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GraduationCap, LogOut, Search, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link to={user ? (user.role === 'LECTURER' ? '/lecturer' : '/student') : '/'} className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center">
                Knust<span className="text-amber-500">Consult</span>
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-semibold -mt-1">
                Academic Booking
              </span>
            </div>
          </Link>

          {/* Navigation & User Profile */}
          {user ? (
            <div className="flex items-center space-x-4">


              {/* User badge */}
              <div className="flex items-center space-x-3 bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl transition-colors">
                <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-tight">{user.name}</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">{user.department || user.email}</p>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    user.role === 'LECTURER'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {user.role}
                </span>
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 transition duration-200 border border-transparent hover:border-amber-500/20 text-lg leading-none"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 transition duration-200 border border-transparent hover:border-rose-500/20"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              {/* Theme toggle for logged-out state too */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 transition duration-200 border border-transparent hover:border-amber-500/20 text-lg leading-none"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <Link
                to="/login"
                className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-3 py-2 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 rounded-xl transition shadow-lg shadow-amber-500/20"
              >
                Register
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
