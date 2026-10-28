import React, { useState } from 'react';
import { Bell, User, ChevronDown, LogOut, CheckCircle, Info, Radio, Sun, Moon } from 'lucide-react';
import { PageRoute } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle: string;
  activeAlertCount: number;
  onNavigateToAlerts: () => void;
  onSignOut: () => void;
  currentUser?: { name: string; email: string; role: string } | null;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  activeAlertCount,
  onNavigateToAlerts,
  onSignOut,
  currentUser
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-colors duration-200">
      {/* Page Title & Subtitle */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
          {title}
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          {subtitle}
        </p>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-700">Dark</span>
            </>
          )}
        </button>

        {/* System Status Pill */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-3" />
          <span>Demo Simulation</span>
        </div>

        {/* Future Hardware Notice Pill */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-medium text-slate-600">
          <Radio className="w-3 h-3 text-slate-400" />
          <span>Hardware: Future Scope</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onNavigateToAlerts}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="System Notifications & Alerts"
        >
          <Bell className="w-5 h-5" />
          {activeAlertCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
              {activeAlertCount}
            </span>
          )}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold leading-none text-slate-800">
                {currentUser?.name || 'Biotech Admin'}
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                {currentUser?.role || 'Lead Process Engineer'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-800">{currentUser?.name || 'Biotech Admin'}</p>
                <p className="text-[11px] text-slate-500">{currentUser?.email || 'admin@dryertwin.com'}</p>
                <div className="mt-1.5 inline-block text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Commercial Facility Role: Engineer
                </div>
              </div>

              <div className="px-4 py-2 border-b border-slate-100 text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Prototype Mode Active</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>Source: Simulated Sensor Engine</span>
                </div>
              </div>

              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-slate-700">
                <span className="font-medium text-[11px]">Appearance Theme:</span>
                <button
                  type="button"
                  onClick={() => toggleTheme()}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-800 flex items-center gap-1.5 transition-colors border border-slate-300"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-3 h-3 text-amber-500" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3 h-3 text-indigo-600" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onSignOut();
                }}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
