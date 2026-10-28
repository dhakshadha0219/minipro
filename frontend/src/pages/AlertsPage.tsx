import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Info, 
  Sliders, 
  Check, 
  RefreshCw, 
  Clock, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Alert } from '../types';
import { api } from '../services/api';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts(
        statusFilter === 'ALL' ? undefined : statusFilter,
        severityFilter === 'ALL' ? undefined : severityFilter
      );
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter]);

  const handleAcknowledge = async (id: number) => {
    try {
      await api.acknowledgeAlert(id);
      fetchAlerts();
    } catch (err) {
      alert('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await api.resolveAlert(id);
      fetchAlerts();
    } catch (err) {
      alert('Failed to resolve alert');
    }
  };

  const handleResolveAll = async () => {
    try {
      await api.resolveAllAlerts();
      fetchAlerts();
    } catch (err) {
      alert('Failed to resolve all alerts');
    }
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return {
          card: 'border-l-4 border-l-red-500 bg-red-50/50 border-red-200',
          badge: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertOctagon,
          iconColor: 'text-red-600'
        };
      case 'WARNING':
        return {
          card: 'border-l-4 border-l-amber-500 bg-amber-50/50 border-amber-200',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: AlertTriangle,
          iconColor: 'text-amber-600'
        };
      case 'INFO':
        return {
          card: 'border-l-4 border-l-blue-500 bg-blue-50/50 border-blue-200',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Info,
          iconColor: 'text-blue-600'
        };
      default:
        return {
          card: 'border-l-4 border-l-emerald-500 bg-emerald-50/50 border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <span>Filter Alerts:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAlerts}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleResolveAll}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Resolve All Active</span>
          </button>
        </div>
      </div>

      {/* Alert Engine Rules Reference Card (Section #15) */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <h3 className="text-sm font-bold flex items-center gap-2 text-white">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Automated Alert Engine Rule Logic (Section #15)
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Real-time DB Trigger</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-800/70 rounded-lg border border-slate-700">
            <div className="font-bold text-red-400 mb-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Temperature Rules
            </div>
            <p className="text-slate-300 text-[11px] font-mono leading-relaxed">
              &lt; 60°C → NORMAL (Green)<br />
              60 – 65°C → WARNING (Amber)<br />
              &gt; 65°C → CRITICAL (Red)
            </p>
          </div>

          <div className="p-3 bg-slate-800/70 rounded-lg border border-slate-700">
            <div className="font-bold text-blue-400 mb-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Humidity Rules
            </div>
            <p className="text-slate-300 text-[11px] font-mono leading-relaxed">
              &lt; 60% → NORMAL (Green)<br />
              60 – 75% → WARNING (Amber)<br />
              &gt; 75% → CRITICAL (Red)
            </p>
          </div>

          <div className="p-3 bg-slate-800/70 rounded-lg border border-slate-700">
            <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Moisture & Completion Rules
            </div>
            <p className="text-slate-300 text-[11px] font-mono leading-relaxed">
              &gt; Target% → DRYING IN PROGRESS<br />
              ≤ Target% (20%) → DRYING COMPLETED<br />
              Door OPEN → Interlock Warning
            </p>
          </div>
        </div>
      </div>

      {/* Alerts List (Section #14) */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-card">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-base font-bold text-slate-800">No Alerts Found</h4>
            <p className="text-xs text-slate-500 mt-1">
              All monitored system parameters are currently operating within safe thresholds.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const style = getSeverityStyle(alert.severity);
            const Icon = style.icon;

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border p-4 shadow-card flex flex-wrap items-center justify-between gap-4 transition-all ${style.card}`}
              >
                <div className="flex items-start space-x-3.5 max-w-2xl">
                  <div className={`p-2 rounded-lg ${style.badge} shrink-0 mt-0.5`}>
                    <Icon className={`w-5 h-5 ${style.iconColor}`} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {alert.parameter} Alert
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
                        {alert.severity}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        alert.status === 'ACTIVE' 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : alert.status === 'ACKNOWLEDGED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {alert.status}
                      </span>
                      {alert.batch_id && (
                        <span className="text-[11px] font-mono text-slate-500">
                          Batch: <strong>{alert.batch_id}</strong>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2 font-mono">
                      <span>Value: <strong className="text-slate-700">{alert.value}</strong></span>
                      <span>Threshold: <strong className="text-slate-700">{alert.threshold}</strong></span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {alert.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-semibold text-xs transition-all"
                    >
                      Acknowledge
                    </button>
                  )}

                  {alert.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
