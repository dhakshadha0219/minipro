import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Cpu, 
  Sliders, 
  Eye, 
  Clock, 
  Check, 
  AlertCircle, 
  Radio, 
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { SystemSettings } from '../types';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface SettingsPageProps {
  currentSettings?: SystemSettings;
  onRefreshGlobalState: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentSettings,
  onRefreshGlobalState
}) => {
  const { theme, setTheme } = useTheme();

  // System Settings
  const [systemName, setSystemName] = useState('Food Dehydration Digital Twin');
  const [dataSource, setDataSource] = useState('Demo Simulation');
  const [monitoringInterval, setMonitoringInterval] = useState(currentSettings?.monitoring_interval || 5);

  // Digital Twin Visual Settings
  const [enableAnimation, setEnableAnimation] = useState(true);
  const [showAirflow, setShowAirflow] = useState(true);
  const [showSensorLabels, setShowSensorLabels] = useState(true);
  const [showHeaterViz, setShowHeaterViz] = useState(true);

  // Thresholds
  const [tempNormalMax, setTempNormalMax] = useState(currentSettings?.temperature_normal_max || 60);
  const [tempWarningMax, setTempWarningMax] = useState(currentSettings?.temperature_warning_max || 65);
  const [tempCriticalMax, setTempCriticalMax] = useState(currentSettings?.temperature_critical_max || 70);

  const [humNormalMax, setHumNormalMax] = useState(currentSettings?.humidity_normal_max || 60);
  const [humWarningMax, setHumWarningMax] = useState(currentSettings?.humidity_warning_max || 75);
  const [humCriticalMax, setHumCriticalMax] = useState(currentSettings?.humidity_critical_max || 85);

  const [moistureTarget, setMoistureTarget] = useState(currentSettings?.moisture_target || 20);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setMonitoringInterval(currentSettings.monitoring_interval);
      setTempNormalMax(currentSettings.temperature_normal_max);
      setTempWarningMax(currentSettings.temperature_warning_max);
      setTempCriticalMax(currentSettings.temperature_critical_max);
      setHumNormalMax(currentSettings.humidity_normal_max);
      setHumWarningMax(currentSettings.humidity_warning_max);
      setHumCriticalMax(currentSettings.humidity_critical_max);
      setMoistureTarget(currentSettings.moisture_target);
    }
  }, [currentSettings]);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateSettings({
        monitoring_interval: Number(monitoringInterval),
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
      onRefreshGlobalState();
    } catch (err) {
      alert('Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6 max-w-5xl">
      {/* Save bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 shadow-card p-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Global System Configuration
          </h2>
          <p className="text-xs text-slate-500">
            Configure environment parameters, sensor polling frequencies, and Digital Twin graphics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <Check className="w-4 h-4" />
              Settings Saved Successfully!
            </span>
          )}

          <button
            type="submit"
            disabled={saving}
            className="py-2 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: System Settings (Section #20) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-600" />
          System Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              System Name
            </label>
            <input
              type="text"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Data Source Mode
            </label>
            <input
              type="text"
              disabled
              value={dataSource}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-500 bg-slate-50 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Physical Arduino Uno R4 WiFi integration is marked for future expansion.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Monitoring Polling Interval (seconds)
            </label>
            <input
              type="number"
              min="2"
              max="60"
              value={monitoringInterval}
              onChange={(e) => setMonitoringInterval(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Configured loop interval for simulation step and DB logging.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Dashboard Theme
            </label>
            <select
              value={theme === 'dark' ? 'Dark' : 'Light'}
              onChange={(e) => setTheme(e.target.value === 'Dark' ? 'dark' : 'light')}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 bg-slate-50 font-medium"
            >
              <option value="Light">Light Mode (Clean Industrial)</option>
              <option value="Dark">Dark Mode (Industrial Navy)</option>
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Toggle immediately updates the entire UI and saves to local storage.
            </span>
          </div>
        </div>

        {/* Safety Interlock Prototype Notice */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
          <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Simulated Door Safety Interlock Engine Active</span>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Software-level safety interlock halts the dryer cycle and powers down heater and circulation fan immediately when the chamber door opens. 
              <strong> Notice:</strong> This is a simulated software safety interlock. When physical hardware is integrated in the future, actual physical safety protection must use an appropriate hardware-level interlock; frontend/backend software alone is not sufficient.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Digital Twin Visual Settings (Section #20) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-600" />
          Digital Twin Visualization Settings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <label className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <div>
              <span className="font-bold text-slate-800 block">Enable Animation</span>
              <span className="text-[11px] text-slate-500">Render live rotating fan and pulsing glowing coils</span>
            </div>
            <input
              type="checkbox"
              checked={enableAnimation}
              onChange={(e) => setEnableAnimation(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <div>
              <span className="font-bold text-slate-800 block">Show Airflow</span>
              <span className="text-[11px] text-slate-500">Animate convective stream lines across mesh trays</span>
            </div>
            <input
              type="checkbox"
              checked={showAirflow}
              onChange={(e) => setShowAirflow(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <div>
              <span className="font-bold text-slate-800 block">Show Sensor Labels</span>
              <span className="text-[11px] text-slate-500">Display telemetry overlays (T1, H1, M1) on chamber</span>
            </div>
            <input
              type="checkbox"
              checked={showSensorLabels}
              onChange={(e) => setShowSensorLabels(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <div>
              <span className="font-bold text-slate-800 block">Show Heater Visualization</span>
              <span className="text-[11px] text-slate-500">Display radiant heat glows and ceramic thermal coils</span>
            </div>
            <input
              type="checkbox"
              checked={showHeaterViz}
              onChange={(e) => setShowHeaterViz(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* SECTION 3 & 4: Sensor & Threshold Settings (Section #20) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600" />
          Sensor Threshold & Target Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Temperature thresholds */}
          <div className="space-y-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1">
              Temperature Limits (°C)
            </span>
            <div>
              <label className="text-[11px] text-slate-600 block">Normal Max</label>
              <input
                type="number"
                value={tempNormalMax}
                onChange={(e) => setTempNormalMax(Number(e.target.value))}
                className="w-full px-2.5 py-1 rounded border border-slate-300 font-mono mt-0.5"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 block">Warning Max</label>
              <input
                type="number"
                value={tempWarningMax}
                onChange={(e) => setTempWarningMax(Number(e.target.value))}
                className="w-full px-2.5 py-1 rounded border border-slate-300 font-mono mt-0.5"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 block">Critical Alarm</label>
              <input
                type="number"
                value={tempCriticalMax}
                onChange={(e) => setTempCriticalMax(Number(e.target.value))}
                className="w-full px-2.5 py-1 rounded border border-slate-300 font-mono mt-0.5"
              />
            </div>
          </div>

          {/* Humidity thresholds */}
          <div className="space-y-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1">
              Humidity Limits (%)
            </span>
            <div>
              <label className="text-[11px] text-slate-600 block">Normal Max</label>
              <input
                type="number"
                value={humNormalMax}
                onChange={(e) => setHumNormalMax(Number(e.target.value))}
                className="w-full px-2.5 py-1 rounded border border-slate-300 font-mono mt-0.5"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 block">Warning Max</label>
              <input
                type="number"
                value={humWarningMax}
                onChange={(e) => setHumWarningMax(Number(e.target.value))}
                className="w-full px-2.5 py-1 rounded border border-slate-300 font-mono mt-0.5"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 block">Critical Alarm</label>
              <input
                type="number"
                value={humCriticalMax}
                onChange={(e) => setHumCriticalMax(Number(e.target.value))}
                className="w-full px-2.5 py-1 rounded border border-slate-300 font-mono mt-0.5"
              />
            </div>
          </div>

          {/* Moisture target */}
          <div className="space-y-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1">
              Target End Point Moisture (%)
            </span>
            <div>
              <label className="text-[11px] text-slate-600 block">Target Moisture</label>
              <input
                type="number"
                value={moistureTarget}
                onChange={(e) => setMoistureTarget(Number(e.target.value))}
                className="w-full px-2.5 py-1 rounded border border-slate-300 font-mono mt-0.5"
              />
            </div>
            <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded text-[11px] text-blue-900 leading-relaxed">
              Target moisture specifies the batch cutoff. The digital twin marks batch completion when food moisture reaches this setpoint.
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
