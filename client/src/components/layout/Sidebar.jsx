import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard, ClipboardList, FileText, ScrollText,
  CheckSquare, Image, Sun, Moon, LogOut, Menu, X, ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/quotes', icon: FileText, label: 'Quotes' },
  { to: '/logs', icon: ScrollText, label: 'Misc Log' },
  { to: '/todos', icon: CheckSquare, label: 'Daily Tasks' },
  { to: '/posters', icon: Image, label: 'Posters' },
];

export default function Sidebar() {
  const { profile, signOut, isAdmin } = useAuth();
  const { dark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-wood-700 text-parchment-50 dark:bg-wood-600'
        : 'text-wood-700 dark:text-parchment-300 hover:bg-parchment-200 dark:hover:bg-wood-800'
    }`;

  const nav = (
    <>
      {/* Brand */}
      <div className="px-4 py-6 border-b border-parchment-200 dark:border-wood-800">
        <h1 className="font-display text-xl font-bold text-wood-800 dark:text-parchment-100">
          Riverside Ranch
        </h1>
        <p className="text-xs text-wood-500 dark:text-wood-400 mt-0.5">Management System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={linkClasses} onClick={() => setMobileOpen(false)}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {/* Admin link — only visible to admins */}
        {isAdmin && (
          <NavLink to="/admin" className={linkClasses} onClick={() => setMobileOpen(false)}>
            <ShieldCheck size={18} />
            Admin Panel
          </NavLink>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-parchment-200 dark:border-wood-800 space-y-2">
        {/* User info */}
        <div className="px-4 py-2">
          <p className="text-sm font-medium truncate">{profile?.characterName || profile?.displayName}</p>
          <p className="text-xs text-wood-500 dark:text-wood-400">
            @{profile?.username} &middot; <span className="capitalize">{profile?.role}</span>
          </p>
        </div>

        {/* Theme toggle */}
        <button onClick={toggle} className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm hover:bg-parchment-200 dark:hover:bg-wood-800 transition-colors">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* Sign out */}
        <button onClick={signOut} className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-wood-900 shadow-md border border-parchment-200 dark:border-wood-700"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)}>
          <aside
            className="w-64 h-full bg-white dark:bg-wood-950 flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1">
              <X size={20} />
            </button>
            {nav}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-wood-950 border-r border-parchment-200 dark:border-wood-800">
        {nav}
      </aside>
    </>
  );
}
