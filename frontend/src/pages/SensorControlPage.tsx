import React, { useState } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Activity, 
  DoorClosed, 
  DoorOpen,
  Power, 
  Wind, 
  Flame, 
  Sliders, 
  Save, 
  AlertCircle, 
  Info, 
  Cpu, 
  Check, 
  RefreshCw 
} from 'lucide-react';
import { DashboardState, SystemSettings } from '../types';
import { api } from '../services/api';

interface SensorControlPageProps {
  state: DashboardState;
  onRefresh: () => void;
}

export const SensorControlPage: React.FC<SensorControlPageProps> = ({
  state,
  onRefresh
}) => {
  const { sensor, digital_twin, settings } = state;

  // Local state for thresholds form
  const [tempNormalMax, setTempNormalMax] = useState(settings?.temperature_normal_max || 60);
  const [tempWarningMax, setTempWarningMax] = useState(settings?.temperature_warning_max || 65);
  const [tempCriticalMax, setTempCriticalMax] = useState(settings?.temperature_critical_max || 70);

  const [humNormalMax, setHumNormalMax] = useState(settings?.humidity_normal_max || 60);
  const [humWarningMax, setHumWarningMax] = useState(settings?.humidity_warning_max || 75);
  const [humCriticalMax, setHumCriticalMax] = useState(settings?.humidity_critical_max || 85);

  const [moistureTarget, setMoistureTarget] = useState(settings?.moisture_target || 20);

  const [savingThresholds, setSavingThresholds] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Actuator toggle handlers
  const handleToggleHeater = async () => {
    const next = digital_twin.heater === 'ON' ? 'OFF' : 'ON';
    if (next === 'ON' && digital_twin.door === 'OPEN') {
      alert('Cannot start heater while door is open. Safety interlock engaged.');
      return;
    }
    try {
      await api.controlActuator({ heater: next });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Cannot start heater while door is open.');
    }
  };

  const handleToggleFan = async () => {
    const next = digital_twin.fan === 'ON' ? 'OFF' : 'ON';
    if (next === 'ON' && digital_twin.door === 'OPEN') {
      alert('Cannot start fan while door is open. Safety interlock engaged.');
      return;
    }
    try {
      await api.controlActuator({ fan: next });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Cannot start fan while door is open.');
    }
  };

  const handleToggleAirflow = async () => {
    const next = digital_twin.airflow_mode === 'AUTO' ? 'MANUAL' : 'AUTO';
    await api.controlActuator({ airflow: next });
    onRefresh();
  };

  const handleToggleMonitoring = async () => {
    const next = settings?.monitoring_enabled ? 'STOP' : 'START';
    await api.controlActuator({ monitoring: next });
    onRefresh();
  };

  const handleToggleDoor = async () => {
    const next = digital_twin.door === 'CLOSED' ? 'OPEN' : 'CLOSED';
    await api.controlActuator({ door: next });
    onRefresh();
  };

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingThresholds(true);
    setSaveSuccess(false);
    try {
      await api.updateSettings({
        temperature_normal_max: Number(tempNormalMax),
        temperature_warning_max: Number(tempWarningMax),
        temperature_critical_max: Number(tempCriticalMax),
        humidity_normal_max: Number(humNormalMax),
        humidity_warning_max: Number(humWarningMax),
        humidity_critical_max: Number(humCriticalMax),
        moisture_target: Number(moistureTarget)
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      alert('Failed to save thresholds');
    } finally {
      setSavingThresholds(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* DOOR SAFETY INTERLOCK BANNER */}
      {digital_twin.door === 'OPEN' && (
        <div className="bg-red-500/10 border-2 border-red-500 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-red-700 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-600 shrink-0">
              <AlertCircle className="w-6 h-6 animate-pulse" />
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
                Heater and fan powered down immediately. Door must be closed before dryer operation can resume.
                <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                  Simulated Safety Interlock. Physical hardware requires hardware-level safety interlock.
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleDoor}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <DoorClosed className="w-4 h-4" />
            <span>Close Door & Engage Interlock</span>
          </button>
        </div>
      )}

      {/* Simulation Notice Banner (Section #11) */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900 shadow-sm">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold flex items-center gap-2">
            <span>Simulation Control Mode Active</span>
            <span className="px-2 py-0.5 rounded bg-amber-200/70 text-amber-900 text-[10px] font-mono">
              Academic Prototype
            </span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            Changing these controls affects the live thermodynamic simulation engine.
            <strong> Note: Physical actuator control requires future Arduino integration.</strong>
          </p>
        </div>
      </div>

      {/* 4 Sensor Cards (Section #11) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Temperature Sensor Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Temperature Sensor
            </span>
            <Thermometer className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {sensor.temperature.toFixed(1)} °C
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500">Status</span>
            <span className="font-bold text-emerald-600 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
              NORMAL
            </span>
          </div>
        </div>

        {/* Humidity Sensor Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Humidity Sensor
            </span>
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {sensor.humidity.toFixed(1)} %
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500">Status</span>
            <span className="font-bold text-emerald-600 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
              NORMAL
            </span>
          </div>
        </div>

        {/* Moisture Sensor Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Moisture Sensor
            </span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {sensor.moisture.toFixed(1)} %
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500">Status</span>
            <span className="font-bold text-blue-600 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
              NORMAL
            </span>
          </div>
        </div>

        {/* Door Sensor Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Door Sensor
            </span>
            {digital_twin.door === 'OPEN' ? (
              <DoorOpen className="w-4 h-4 text-amber-500" />
            ) : (
              <DoorClosed className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {digital_twin.door}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500">Interlock State</span>
            <button
              onClick={handleToggleDoor}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              Toggle {digital_twin.door === 'CLOSED' ? 'Open' : 'Close'}
            </button>
          </div>
        </div>
      </div>

      {/* Actuator Controls Section (Section #11) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Power className="w-4 h-4 text-blue-600" />
              Actuator Control Panel
            </h3>
            <p className="text-xs text-slate-400">
              Manual actuation override for thermodynamic simulation elements
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 px-2 py-1 bg-slate-100 rounded border border-slate-200">
            Mode: Interactive Twin Control
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Heater Actuator */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700">Heater Element</span>
              <Flame className={`w-4 h-4 ${digital_twin.heater === 'ON' ? 'text-red-500' : 'text-slate-400'}`} />
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Controls heating elements. Affects temperature rate of change.
            </p>
            <button
              onClick={handleToggleHeater}
              className={`w-full py-2 px-3 rounded-lg font-bold text-xs transition-all shadow-sm ${
                digital_twin.heater === 'ON'
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Heater: {digital_twin.heater}
            </button>
          </div>

          {/* Fan Actuator */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700">Convection Fan</span>
              <Wind className={`w-4 h-4 ${digital_twin.fan === 'ON' ? 'text-cyan-500' : 'text-slate-400'}`} />
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Controls exhaust blower. Affects airflow rate and moisture evacuation.
            </p>
            <button
              onClick={handleToggleFan}
              className={`w-full py-2 px-3 rounded-lg font-bold text-xs transition-all shadow-sm ${
                digital_twin.fan === 'ON'
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-600/20'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Fan: {digital_twin.fan}
            </button>
          </div>

          {/* Airflow Mode */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700">Airflow Mode</span>
              <Sliders className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xs text-slate-500 mb-3">
              AUTO mode dynamically triggers fan based on chamber temperature setpoints.
            </p>
            <button
              onClick={handleToggleAirflow}
              className={`w-full py-2 px-3 rounded-lg font-bold text-xs transition-all shadow-sm ${
                digital_twin.airflow_mode === 'AUTO'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Airflow: {digital_twin.airflow_mode}
            </button>
          </div>

          {/* Monitoring Engine */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700">Monitoring Engine</span>
              <Power className={`w-4 h-4 ${settings?.monitoring_enabled ? 'text-emerald-500' : 'text-slate-400'}`} />
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Controls periodic background sampling and database telemetry logging.
            </p>
            <button
              onClick={handleToggleMonitoring}
              className={`w-full py-2 px-3 rounded-lg font-bold text-xs transition-all shadow-sm ${
                settings?.monitoring_enabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Monitoring: {settings?.monitoring_enabled ? 'START' : 'STOP'}
            </button>
          </div>
        </div>
      </div>

      {/* Threshold Configuration Form (Section #12) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Threshold Configuration
            </h3>
            <p className="text-xs text-slate-400">
              Configure trigger boundaries for automatic alert and safety interlocking engine
            </p>
          </div>
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <Check className="w-3.5 h-3.5" />
              Thresholds Saved to Database!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveThresholds} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Temperature Thresholds */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                <Thermometer className="w-4 h-4 text-red-500" />
                <span>Temperature Thresholds (°C)</span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Normal Range Upper Limit
                </label>
                <input
                  type="number"
                  value={tempNormalMax}
                  onChange={(e) => setTempNormalMax(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                  step="0.5"
                />
                <span className="text-[10px] text-slate-400">Default: 40–60 °C</span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Warning Level Threshold
                </label>
                <input
                  type="number"
                  value={tempWarningMax}
                  onChange={(e) => setTempWarningMax(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                  step="0.5"
                />
                <span className="text-[10px] text-slate-400">Default: 60–65 °C</span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Critical Alarm Level
                </label>
                <input
                  type="number"
                  value={tempCriticalMax}
                  onChange={(e) => setTempCriticalMax(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                  step="0.5"
                />
                <span className="text-[10px] text-slate-400">Default: &gt; 65 °C</span>
              </div>
            </div>

            {/* Humidity Thresholds */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span>Humidity Thresholds (%)</span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Normal RH Upper Limit
                </label>
                <input
                  type="number"
                  value={humNormalMax}
                  onChange={(e) => setHumNormalMax(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                />
                <span className="text-[10px] text-slate-400">Default: &lt; 60 %</span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Warning RH Level
                </label>
                <input
                  type="number"
                  value={humWarningMax}
                  onChange={(e) => setHumWarningMax(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                />
                <span className="text-[10px] text-slate-400">Default: 60–75 %</span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Critical RH Alarm Level
                </label>
                <input
                  type="number"
                  value={humCriticalMax}
                  onChange={(e) => setHumCriticalMax(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                />
                <span className="text-[10px] text-slate-400">Default: &gt; 75 %</span>
              </div>
            </div>

            {/* Moisture Target */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Product Moisture Target</span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  End Point Target Moisture (%)
                </label>
                <input
                  type="number"
                  value={moistureTarget}
                  onChange={(e) => setMoistureTarget(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                  step="0.5"
                />
                <span className="text-[10px] text-slate-400">Default Target: 20 %</span>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-[11px] text-blue-800 space-y-1">
                <span className="font-bold block">Automatic Batch Completion</span>
                <p>
                  When the simulated food moisture drops to or below this target value, the batch state automatically transitions to <strong>COMPLETED</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingThresholds}
              className="py-2.5 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {savingThresholds ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Thresholds</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
