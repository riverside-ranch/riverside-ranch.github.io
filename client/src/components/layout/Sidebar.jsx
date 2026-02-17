import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard, ClipboardList, FileText, ScrollText,
  CheckSquare, Image, DollarSign, Sun, Moon, LogOut, Menu, X, ShieldCheck, Map,
  BookOpen, Hammer, Activity,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/quotes', icon: FileText, label: 'Quotes' },
  { to: '/prices', icon: DollarSign, label: 'Prices' },
  { to: '/logs', icon: ScrollText, label: 'Misc Log' },
  { to: '/todos', icon: CheckSquare, label: 'To-Do List' },
  { to: '/posters', icon: Image, label: 'Posters' },
  { to: '/recipes', icon: BookOpen, label: 'Recipes' },
  { to: '/crafting', icon: Hammer, label: 'Crafting' },
  { to: '/map', icon: Map, label: 'Interactive Map' },
  { to: '/activity', icon: Activity, label: 'Activity Timeline' },
];

export default function Sidebar() {
  const { profile, signOut, isAdmin } = useAuth();
  const { dark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
        : 'text-parchment-600 dark:text-wood-200 hover:bg-parchment-100 dark:hover:bg-wood-800 hover:text-parchment-900 dark:hover:text-white'
    }`;

  const nav = (
    <>
      {/* Brand */}
      <div className="px-4 py-5 border-b border-parchment-200 dark:border-wood-800">
        <img src="/Riverside_Ranch.png" alt="Riverside Ranch" className="w-20 h-20 mx-auto mb-2 object-contain" />
        <h1 className="font-display text-xl font-bold text-parchment-800 dark:text-white text-center">
          Riverside Ranch
        </h1>
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
          <p className="text-sm font-medium truncate text-parchment-800 dark:text-white">{profile?.characterName || profile?.displayName}</p>
          <p className="text-xs text-parchment-500 dark:text-parchment-400 capitalize">{profile?.role}</p>
        </div>

        {/* Theme toggle */}
        <button onClick={toggle} className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm text-parchment-600 dark:text-wood-200 hover:bg-parchment-100 dark:hover:bg-wood-800 transition-colors">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* Sign out */}
        <button onClick={signOut} className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <LogOut size={18} />
          Sign Out
        </button>

        {/* Watermark */}
        <p className="text-[10px] text-parchment-400 dark:text-wood-500 text-center pt-2">Developed by mads for Riverside Ranch</p>
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
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1 text-parchment-400">
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
