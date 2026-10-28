import React from 'react';
import { 
  LayoutDashboard, 
  Sliders, 
  BarChart3, 
  AlertTriangle, 
  History, 
  Layers, 
  FileText, 
  Settings, 
  Workflow,
  Cpu,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { PageRoute } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  activeAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  onNavigate, 
  activeAlertCount 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const navItems: { id: PageRoute; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'workflow', label: 'Work Flow', icon: Workflow },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sensors', label: 'Live Sensor Control', icon: Sliders },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'history', label: 'History', icon: History },
    { id: 'batches', label: 'Batch Management', icon: Layers },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`w-64 flex flex-col justify-between shrink-0 select-none shadow-xl z-20 transition-colors duration-200 ${
      isDark 
        ? 'bg-navy-900 border-r border-slate-800 text-slate-300' 
        : 'bg-white border-r border-slate-200 text-slate-600'
    }`}>
      <div>
        {/* Brand Header */}
        <div className={`p-5 border-b ${
          isDark 
            ? 'border-slate-800/80 bg-navy-950/60' 
            : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`font-bold text-lg tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                DRYER TWIN
              </h1>
              <p className={`text-xs font-medium tracking-tight ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Food Dehydration Monitoring System
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30 translate-x-0.5'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>

                {item.id === 'alerts' && activeAlertCount > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-blue-700' : 'bg-red-500 text-white animate-pulse'
                  }`}>
                    {activeAlertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Academic / Prototype Info Footer */}
      <div className={`p-4 border-t space-y-2 ${
        isDark 
          ? 'border-slate-800/80 bg-navy-950/40' 
          : 'border-slate-200 bg-slate-50/80'
      }`}>
        <div className={`rounded-lg p-2.5 border text-[11px] ${
          isDark 
            ? 'bg-slate-800/50 border-slate-700/50 text-slate-400' 
            : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-1.5 text-blue-500 font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Academic Prototype</span>
          </div>
          <p className={isDark ? 'text-slate-400 leading-tight' : 'text-slate-600 leading-tight'}>
            B.Tech Biotechnology Mini-Project
          </p>
          <div className="mt-1.5 flex items-center justify-between text-[10px]">
            <span className="text-emerald-500 font-mono font-semibold">Demo Simulation</span>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Uno R4: Future</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
