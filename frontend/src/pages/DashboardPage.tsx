import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Activity, 
  Percent, 
  Clock, 
  Layers, 
  Play, 
  Pause, 
  Square, 
  AlertTriangle,
  AlertOctagon,
  Flame,
  Wind,
  CheckCircle2,
  Calendar,
  Sparkles,
  DoorClosed,
  DoorOpen,
  ShieldAlert
} from 'lucide-react';
import { DashboardState, PageRoute } from '../types';
import { DigitalTwin } from '../components/digitaltwin/DigitalTwin';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardPageProps {
  state: DashboardState;
  onNavigate: (page: PageRoute) => void;
  onBatchStatusChange: (status: 'RUNNING' | 'PAUSED' | 'STOPPED' | 'COMPLETED') => void;
  onToggleDoor?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  state,
  onNavigate,
  onBatchStatusChange,
  onToggleDoor
}) => {
  const { sensor, batch, digital_twin, active_alerts, recent_readings } = state;

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return 'Not Started';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'PAUSED':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'STOPPED':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* DOOR SAFETY INTERLOCK BANNER (Requirement A) */}
      {digital_twin.door === 'OPEN' && (
        <div className="bg-red-500/10 border-2 border-red-500 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-red-700 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-600 shrink-0">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm uppercase tracking-wide">
                  SAFETY ALERT: Door is open. Dryer stopped.
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 font-bold">
                  INTERLOCK TRIPPED
                </span>
              </div>
              <p className="text-xs text-red-600/90 mt-0.5">
                Heater turned OFF • Convection fan turned OFF • Drying cycle halted. Dryer cannot operate while door remains open.
                <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                  Simulated Safety Interlock. Physical hardware requires hardware-level safety interlock.
                </span>
              </p>
            </div>
          </div>

          {onToggleDoor && (
            <button
              onClick={onToggleDoor}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-red-600/20 flex items-center gap-1.5"
            >
              <DoorClosed className="w-4 h-4" />
              <span>Close Door & Ready</span>
            </button>
          )}
        </div>
      )}

      {/* Current Batch Banner Card (Section #8) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Current Batch
                </span>
                <span className="text-sm font-black font-mono px-2 py-0.5 rounded bg-blue-100/70 text-blue-800 border border-blue-200">
                  {batch?.batch_id || 'B001'}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(batch?.status || 'RUNNING')}`}>
                  ● {batch?.status || 'RUNNING'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {batch?.product_name || 'Apple Slices'}
              </h2>
            </div>
          </div>

          {/* Batch Metrics Details */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[11px]">Start Time</span>
              <strong className="text-slate-800 font-mono text-sm">
                {formatTime(batch?.start_time)}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Target Moisture</span>
              <strong className="text-slate-800 font-mono text-sm">
                {batch?.target_moisture || 20}%
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Setpoint</span>
              <strong className="text-slate-800 font-mono text-sm">
                {batch?.temperature_setpoint || 55.0}°C
              </strong>
            </div>

            {/* Quick Batch Controls */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              {batch?.status === 'RUNNING' ? (
                <button
                  onClick={() => onBatchStatusChange('PAUSED')}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-medium text-xs flex items-center gap-1.5 transition-all"
                  title="Pause current batch"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={() => onBatchStatusChange('RUNNING')}
                  className={`px-3 py-1.5 rounded-lg border font-medium text-xs flex items-center gap-1.5 transition-all ${
                    digital_twin.door === 'OPEN'
                      ? 'bg-slate-100 text-slate-400 border-slate-300 opacity-70'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                  title={digital_twin.door === 'OPEN' ? 'Cannot start dryer while door is open' : 'Start/Resume batch'}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </button>
              )}

              <button
                onClick={() => onBatchStatusChange('STOPPED')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs flex items-center gap-1 transition-all"
                title="Stop batch"
              >
                <Square className="w-3.5 h-3.5 text-slate-500" />
                <span>Stop</span>
              </button>

              <button
                onClick={() => onNavigate('batches')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-all shadow-sm shadow-blue-500/20"
              >
                Manage Batches
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 CORE SENSOR CARDS (Section #8: Temperature, Humidity, Moisture, Drying Progress) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sensor 1: Temperature */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Temperature
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tight flex items-baseline gap-1">
              {sensor.temperature.toFixed(1)}
              <span className="text-base font-semibold text-slate-400">°C</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-medium text-slate-500">
                Setpoint: {batch?.temperature_setpoint || 55.0}°C
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                NORMAL
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
            <span>Heater Status: <strong className="text-slate-700">{digital_twin.heater}</strong></span>
            <span>Sensor: PT100 Sim</span>
          </div>
        </div>

        {/* Sensor 2: Humidity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Chamber Humidity
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tight flex items-baseline gap-1">
              {sensor.humidity.toFixed(1)}
              <span className="text-base font-semibold text-slate-400">%</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-medium text-slate-500">
                Threshold: &lt; 60%
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                NORMAL
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
            <span>Vent Fan: <strong className="text-slate-700">{digital_twin.fan}</strong></span>
            <span>Sensor: DHT22 Sim</span>
          </div>
        </div>

        {/* Sensor 3: Product Moisture */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Product Moisture
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tight flex items-baseline gap-1">
              {sensor.moisture.toFixed(1)}
              <span className="text-base font-semibold text-slate-400">%</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-medium text-slate-500">
                Target: {batch?.target_moisture || 20}%
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                DEHYDRATING
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
            <span>Reduction: <strong className="text-slate-700">{(batch ? Math.max(0, batch.initial_moisture - sensor.moisture) : 0).toFixed(1)}%</strong></span>
            <span>Sensor: Capacitive Sim</span>
          </div>
        </div>

        {/* Sensor 4: Drying Progress */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Drying Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tight flex items-baseline gap-1">
              {batch?.progress || 0}
              <span className="text-base font-semibold text-slate-400">%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden border border-slate-200">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, batch?.progress || 0))}%` }}
              />
            </div>
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
            <span>Est. Remaining: <strong className="text-slate-700">~1h 15m</strong></span>
            <span>Fickian Kinetic Model</span>
          </div>
        </div>
      </div>

      {/* DIGITAL TWIN VISUALIZATION (Section #9 & #10) */}
      <DigitalTwin 
        sensor={sensor}
        twinState={digital_twin}
        batchInfo={batch}
        onToggleDoor={onToggleDoor}
      />

      {/* Real-time Telemetry Trend & Active Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Telemetry Trend Mini Chart */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Live Sensor Dynamics (Recent Simulation Readings)
              </h3>
              <p className="text-xs text-slate-400">
                Synchronized real-time temperature, humidity and moisture trajectory
              </p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Full Analytics →
            </button>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recent_readings}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="moistGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(val) => {
                    try {
                      return new Date(val).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
                    } catch {
                      return '';
                    }
                  }}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(val: any) => (val ? new Date(val).toLocaleTimeString() : '')}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#tempGrad)" />
                <Area type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#humGrad)" />
                <Area type="monotone" dataKey="moisture" name="Moisture (%)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#moistGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Alerts Feed */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Active Alerts Feed
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {active_alerts.length} Active
              </span>
            </div>

            <div className="space-y-2.5">
              {active_alerts.length === 0 ? (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-center text-xs text-emerald-800">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <p className="font-semibold">All Parameters Normal</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">Sensors operating within configured thresholds</p>
                </div>
              ) : (
                active_alerts.slice(0, 3).map((alert: any) => (
                  <div 
                    key={alert.id}
                    className={`p-3 rounded-lg border text-xs ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : alert.severity === 'WARNING'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{alert.parameter}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/80">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-tight">
                      {alert.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('alerts')}
            className="w-full mt-4 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs text-center transition-all"
          >
            View Alert Engine Rules & History →
          </button>
        </div>
      </div>
    </div>
  );
};
