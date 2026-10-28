import React from 'react';
import { 
  Flame, 
  Wind, 
  Thermometer, 
  Droplets, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Layers,
  DoorClosed,
  DoorOpen,
  Cpu,
  RotateCw
} from 'lucide-react';
import { DigitalTwinState, SensorReading } from '../../types';
import { Dehydrator3D } from './Dehydrator3D';

interface DigitalTwinProps {
  sensor: SensorReading;
  twinState: DigitalTwinState;
  batchInfo?: {
    batch_id: string;
    product_name: string;
    status: string;
    progress: number;
  } | null;
  onToggleDoor?: () => void;
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({
  sensor,
  twinState,
  batchInfo,
  onToggleDoor
}) => {
  const isHeaterOn = twinState.heater === 'ON';
  const isFanOn = twinState.fan === 'ON';
  const isDoorOpen = twinState.door === 'OPEN';

  // Status badge config
  const statusConfig = {
    NORMAL: {
      color: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      badge: 'NORMAL CONDITION',
      icon: CheckCircle2,
      glow: 'shadow-emerald-500/10'
    },
    WARNING: {
      color: 'bg-amber-50 text-amber-700 border-amber-300',
      badge: 'WARNING THRESHOLD',
      icon: AlertTriangle,
      glow: 'shadow-amber-500/20'
    },
    CRITICAL: {
      color: 'bg-red-50 text-red-700 border-red-300',
      badge: 'CRITICAL LIMIT EXCEEDED',
      icon: AlertOctagon,
      glow: 'shadow-red-500/30'
    },
    COMPLETED: {
      color: 'bg-blue-50 text-blue-700 border-blue-300',
      badge: 'DRYING COMPLETED',
      icon: CheckCircle2,
      glow: 'shadow-blue-500/20'
    }
  }[twinState.status] || {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    badge: 'NORMAL',
    icon: CheckCircle2,
    glow: ''
  };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 flex flex-col justify-between relative overflow-hidden">
      {/* Top Header / Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              Digital Twin Simulation
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Twin ID: DT-CHAMBER-01
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time physical chamber twin synchronized with sensor telemetry
          </p>
        </div>

        {/* Dynamic Condition Status */}
        <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 shadow-sm ${statusConfig.color} ${statusConfig.glow}`}>
          <StatusIcon className="w-4 h-4" />
          <span>{statusConfig.badge}</span>
        </div>
      </div>

      {/* Main 3D Dryer Physical Visualization Viewport (Change 1) */}
      <div className="my-6 relative bg-gradient-to-b from-slate-900 via-slate-850 to-slate-950 rounded-xl p-5 border-2 border-slate-700 text-white shadow-inner">
        {/* Exterior Chamber Frame & Top Exhaust Header */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono border-b border-slate-800 pb-3 mb-4">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Cpu className="w-4 h-4 text-cyan-400" />
            COMMERCIAL TRAY DEHYDRATOR UNIT (3D DIGITAL TWIN)
          </span>
          <span className="flex items-center gap-2">
            <span className="text-slate-400">EXHAUST DUCT:</span>
            <span className={isFanOn ? 'text-cyan-400 font-semibold animate-pulse' : 'text-slate-500'}>
              {isFanOn ? 'VENTILATING (1.4 m/s)' : 'RESTING (0.0 m/s)'}
            </span>
          </span>
        </div>

        {/* Grid containing 3D Interactive Model and Chamber Telemetry Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Main 3D Canvas Viewport (9 Columns) */}
          <div className="lg:col-span-9">
            <Dehydrator3D
              sensor={sensor}
              twinState={twinState}
              batchInfo={batchInfo}
              onToggleDoor={onToggleDoor}
            />
          </div>

          {/* Right Column: Real-time Chamber Telemetry Probes & Interlock (3 Columns) */}
          <div className="lg:col-span-3 flex flex-col justify-between space-y-3 h-full">
            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80 shadow-md">
              <div className="text-[11px] font-bold text-slate-300 tracking-wider uppercase mb-2.5 text-center border-b border-slate-700/60 pb-1.5">
                Chamber Telemetry
              </div>

              {/* Probe 1: Temperature */}
              <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-700 mb-2.5">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                  <span className="flex items-center gap-1 font-medium text-slate-300">
                    <Thermometer className="w-3.5 h-3.5 text-red-400" />
                    Chamber Temp
                  </span>
                  <span className="text-[9px] text-slate-400">Sensor T1</span>
                </div>
                <div className="text-xl font-mono font-bold text-white flex items-baseline gap-1">
                  {sensor.temperature.toFixed(1)}
                  <span className="text-xs font-normal text-slate-400">°C</span>
                </div>
              </div>

              {/* Probe 2: Humidity */}
              <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-700 mb-2.5">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                  <span className="flex items-center gap-1 font-medium text-slate-300">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                    Chamber RH
                  </span>
                  <span className="text-[9px] text-slate-400">Sensor H1</span>
                </div>
                <div className="text-xl font-mono font-bold text-white flex items-baseline gap-1">
                  {sensor.humidity.toFixed(1)}
                  <span className="text-xs font-normal text-slate-400">%</span>
                </div>
              </div>

              {/* Probe 3: Moisture */}
              <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-700">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                  <span className="flex items-center gap-1 font-medium text-slate-300">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Sample Moisture
                  </span>
                  <span className="text-[9px] text-slate-400">Sensor M1</span>
                </div>
                <div className="text-xl font-mono font-bold text-white flex items-baseline gap-1">
                  {sensor.moisture.toFixed(1)}
                  <span className="text-xs font-normal text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Door Interlock & Blower Speed Status */}
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 text-slate-400">
                  {isDoorOpen ? <DoorOpen className="w-4 h-4 text-red-400" /> : <DoorClosed className="w-4 h-4 text-emerald-400" />}
                  Door Interlock:
                </span>
                <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isDoorOpen ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {isDoorOpen ? 'OPEN (TRIPPED)' : 'CLOSED (READY)'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-700/60">
                <span className="flex items-center gap-1 text-slate-400">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  Airflow Mode:
                </span>
                <span className="font-bold text-white text-[10px] font-mono">
                  {twinState.airflow_mode}
                </span>
              </div>

              {onToggleDoor && (
                <button
                  type="button"
                  onClick={onToggleDoor}
                  className={`w-full mt-2 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isDoorOpen
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  }`}
                >
                  {isDoorOpen ? (
                    <>
                      <DoorClosed className="w-3.5 h-3.5" />
                      <span>Close Chamber Door</span>
                    </>
                  ) : (
                    <>
                      <DoorOpen className="w-3.5 h-3.5" />
                      <span>Open Chamber Door (Trip)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Real-time sync guarantee footnote */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-[10px] text-slate-400 gap-2">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Interactive 3D Digital Twin synchronized with single source of truth (DB & Sensor simulation engine)
          </span>
          <span className="font-mono text-slate-400">
            Data Source: {sensor.data_source}
          </span>
        </div>
      </div>

      {/* Actuator & Process Status Footer (Preserved exactly) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-[11px] block">Heater Output</span>
          <span className={`font-bold ${isHeaterOn ? 'text-red-600' : 'text-slate-600'}`}>
            {twinState.heater} (Active Thermal PID)
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-[11px] block">Circulation Fan</span>
          <span className={`font-bold ${isFanOn ? 'text-cyan-600' : 'text-slate-600'}`}>
            {twinState.fan} ({twinState.airflow_mode})
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-[11px] block">Current Product</span>
          <span className="font-bold text-slate-800">
            {batchInfo ? `${batchInfo.batch_id} — ${batchInfo.product_name}` : 'No Active Batch'}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-[11px] block">Drying Progress</span>
          <span className="font-bold text-blue-600">
            {batchInfo ? `${batchInfo.progress}% Completed` : '0%'}
          </span>
        </div>
      </div>
    </div>
  );
};
