import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Thermometer, 
  Droplets, 
  Activity, 
  Zap, 
  Filter, 
  RefreshCw,
  Clock,
  Layers,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from 'recharts';
import { api } from '../services/api';
import { SensorReading, Batch, SystemSettings } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [timeRangeMinutes, setTimeRangeMinutes] = useState<number>(60); // Default: Last 1 Hour (60 mins)
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  const fetchAnalyticsData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [historyData, batchData, settingsData] = await Promise.all([
        api.getSensorHistory(selectedBatch === 'ALL' ? undefined : selectedBatch, 500, timeRangeMinutes),
        api.getBatches(),
        api.getSettings()
      ]);

      // Filter in-memory to ensure strictly within selected window
      const cutoff = new Date(Date.now() - timeRangeMinutes * 60 * 1000);
      const filtered = historyData.filter(r => new Date(r.timestamp) >= cutoff);

      setReadings(filtered);
      setBatches(batchData);
      setSettings(settingsData);
      setLastUpdatedTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load analytics data', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    // Auto-update every 5 seconds as new simulated readings are recorded
    const interval = setInterval(() => {
      fetchAnalyticsData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedBatch, timeRangeMinutes]);

  // Active / Selected Batch
  const activeBatch = batches.find(b => b.status === 'RUNNING') || batches[0];
  const currentBatchObj = selectedBatch !== 'ALL' 
    ? batches.find(b => b.batch_id === selectedBatch) || activeBatch 
    : activeBatch;

  // Latest reading
  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;

  // Temperature metrics
  const currentTemp = latestReading ? latestReading.temperature : 55.2;
  const avgTemp = readings.length > 0
    ? (readings.reduce((acc, r) => acc + r.temperature, 0) / readings.length).toFixed(1)
    : '55.2';

  // Humidity metrics
  const currentHum = latestReading ? latestReading.humidity : 42.0;
  const avgHum = readings.length > 0
    ? (readings.reduce((acc, r) => acc + r.humidity, 0) / readings.length).toFixed(1)
    : '42.0';

  // Moisture metrics & calculations (Section D)
  const initialMoisture = currentBatchObj ? currentBatchObj.initial_moisture : (readings.length > 0 ? readings[0].moisture : 80.0);
  const currentMoisture = latestReading ? latestReading.moisture : (currentBatchObj ? currentBatchObj.target_moisture + 10 : 31.0);
  const targetMoisture = currentBatchObj ? currentBatchObj.target_moisture : (settings?.moisture_target || 20.0);
  
  // Moisture Reduction = Initial Moisture - Current Moisture (points)
  const moistureReductionPoints = Math.max(0, initialMoisture - currentMoisture);
  // Relative Moisture Reduction (%) = ((Initial - Current) / Initial) * 100
  const relativeMoistureReductionPct = initialMoisture > 0 
    ? ((initialMoisture - currentMoisture) / initialMoisture) * 100.0 
    : 0.0;

  // Thresholds from settings
  const tempWarnThreshold = settings?.temperature_warning_max || 65.0;
  const humWarnThreshold = settings?.humidity_warning_max || 75.0;
  const tempSetpoint = currentBatchObj?.temperature_setpoint || 55.0;

  // Thermal Performance Indicator proxy data calculation (Section E)
  // Transparent, documented proxy based on temperature stability and setpoint deviation
  const chartData = readings.map((r, i) => {
    const deviation = Math.abs(r.temperature - tempSetpoint);
    // Proxy score: 100% when right on setpoint, dropping as deviation increases
    const thermalStabilityScore = Math.max(20, Math.min(100, Math.round(100 - deviation * 7.5)));

    return {
      id: r.id,
      timestamp: r.timestamp,
      timeLabel: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      temperature: r.temperature,
      humidity: r.humidity,
      moisture: r.moisture,
      initialMoisture: initialMoisture,
      targetMoisture: targetMoisture,
      moistureReduction: Math.max(0, Math.round((initialMoisture - r.moisture) * 10) / 10),
      thermalIndicator: thermalStabilityScore,
      isLatest: i === readings.length - 1
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Filter & Time-Range Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Time Range & Scope:</span>
          </div>

          {/* Time Range Selector (Default: Last 1 Hour) */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <button
              onClick={() => setTimeRangeMinutes(60)}
              className={`px-2.5 py-1 rounded-md font-bold text-xs transition-all ${
                timeRangeMinutes === 60 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              LAST 1 HOUR (Default)
            </button>
            <button
              onClick={() => setTimeRangeMinutes(120)}
              className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
                timeRangeMinutes === 120 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 2 Hours
            </button>
            <button
              onClick={() => setTimeRangeMinutes(1440)}
              className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
                timeRangeMinutes === 1440 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Data (24h)
            </button>
          </div>

          {/* Batch Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Batch Filter:</span>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Batches (Facility Chamber)</option>
              {batches.map(b => (
                <option key={b.id} value={b.batch_id}>
                  {b.batch_id} — {b.product_name} ({b.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Auto-Update Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Auto-Updating</span>
            {lastUpdatedTime && <span className="text-slate-400">({lastUpdatedTime})</span>}
          </div>

          <button
            onClick={() => fetchAnalyticsData(false)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Temperature */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Current / Avg Temperature</span>
            <Thermometer className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-2 flex items-baseline gap-2">
            <span>{currentTemp.toFixed(1)}°C</span>
            <span className="text-xs font-medium text-slate-400 font-sans">Avg: {avgTemp}°C</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Setpoint: <strong>{tempSetpoint}°C</strong></span>
            <span className="text-amber-600 font-mono">Warn: {tempWarnThreshold}°C</span>
          </div>
        </div>

        {/* KPI 2: Humidity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Current / Avg Humidity</span>
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-2 flex items-baseline gap-2">
            <span>{currentHum.toFixed(1)}%</span>
            <span className="text-xs font-medium text-slate-400 font-sans">Avg: {avgHum}%</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Chamber RH</span>
            <span className="text-blue-600 font-mono">Limit: &lt; {humWarnThreshold}%</span>
          </div>
        </div>

        {/* KPI 3: Moisture Reduction */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Moisture Reduction</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 mt-2 flex items-baseline gap-1">
            <span>-{moistureReductionPoints.toFixed(1)}%</span>
            <span className="text-xs font-bold text-slate-500 font-sans">points</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Relative Reduction:</span>
            <strong className="text-emerald-700 font-mono">{relativeMoistureReductionPct.toFixed(1)}%</strong>
          </div>
        </div>

        {/* KPI 4: Thermal Performance Indicator (Documented Proxy) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Thermal Performance</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-2 flex items-baseline gap-1">
            <span>{chartData.length > 0 ? chartData[chartData.length - 1].thermalIndicator : 92}%</span>
            <span className="text-xs font-normal text-slate-400 font-sans">Index</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Simulated Stability Index</span>
            <span className="text-emerald-600 font-semibold">PID Regulated</span>
          </div>
        </div>
      </div>

      {/* Insufficient Data Alert Banner if dataset has fewer than 5 readings */}
      {readings.length < 5 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Accumulating historical readings for the selected 1-hour window. The simulation engine logs points periodically into SQLite; data will continuously append.
          </span>
        </div>
      )}

      {/* 4 DEDICATED SENSOR GRAPHS (Section B, C, D, E) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* GRAPH 1: TEMPERATURE GRAPH (Line Chart, °C) - Section B */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-red-500" />
                Temperature Profile (Last 1 Hour)
              </h3>
              <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                Current: {currentTemp.toFixed(1)} °C
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Chamber thermal trajectory with configured setpoint ({tempSetpoint}°C) and warning limit ({tempWarnThreshold}°C)
            </p>
          </div>

          <div className="h-64 w-full">
            {readings.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No temperature readings recorded in the last 1 hour.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="timeLabel" 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} unit="°C" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`${val} °C`, 'Chamber Temp']}
                  />
                  <ReferenceLine y={tempSetpoint} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: `Setpoint: ${tempSetpoint}°C`, fill: '#3b82f6', fontSize: 10 }} />
                  <ReferenceLine y={tempWarnThreshold} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `Warning: ${tempWarnThreshold}°C`, fill: '#f59e0b', fontSize: 10 }} />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    name="Chamber Temp (°C)" 
                    stroke="#ef4444" 
                    strokeWidth={2.5} 
                    dot={{ r: 2 }}
                    activeDot={{ r: 6, fill: '#dc2626' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Unit: Degrees Celsius (°C)</span>
            <span>Latest: <strong className="text-slate-700 font-mono">{currentTemp.toFixed(1)}°C</strong></span>
          </div>
        </div>

        {/* GRAPH 2: HUMIDITY GRAPH (Area Chart, %) - Section C */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                Relative Humidity Curve (Last 1 Hour)
              </h3>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Current: {currentHum.toFixed(1)} %
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Chamber vapor moisture evacuation curve with upper warning limit ({humWarnThreshold}%)
            </p>
          </div>

          <div className="h-64 w-full">
            {readings.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No humidity readings recorded in the last 1 hour.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="humGradientArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="timeLabel" 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis domain={[10, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`${val} %`, 'Relative Humidity']}
                  />
                  <ReferenceLine y={humWarnThreshold} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `Limit: ${humWarnThreshold}%`, fill: '#f59e0b', fontSize: 10 }} />
                  <Area 
                    type="monotone" 
                    dataKey="humidity" 
                    name="Relative Humidity (%)" 
                    stroke="#3b82f6" 
                    strokeWidth={2.5} 
                    fillOpacity={1}
                    fill="url(#humGradientArea)"
                    activeDot={{ r: 6, fill: '#2563eb' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Unit: Relative Humidity Percentage (%)</span>
            <span>Latest: <strong className="text-slate-700 font-mono">{currentHum.toFixed(1)}%</strong></span>
          </div>
        </div>

        {/* GRAPH 3: MOISTURE REDUCTION GRAPH (Line Chart, %) - Section D */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Food Moisture Reduction Kinetics
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Current: {currentMoisture.toFixed(1)} %
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Initial Moisture: <strong>{initialMoisture}%</strong> • Target Moisture: <strong>{targetMoisture}%</strong> • Net Reduction: <strong className="text-emerald-600">-{moistureReductionPoints.toFixed(1)}%</strong>
            </p>
          </div>

          <div className="h-64 w-full">
            {readings.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No moisture readings recorded in the last 1 hour.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="timeLabel" 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis domain={[10, 95]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`${val} %`, 'Moisture']}
                  />
                  <ReferenceLine y={initialMoisture} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: `Initial: ${initialMoisture}%`, fill: '#64748b', fontSize: 10 }} />
                  <ReferenceLine y={targetMoisture} stroke="#10b981" strokeDasharray="4 4" label={{ value: `Target: ${targetMoisture}%`, fill: '#059669', fontSize: 10 }} />
                  <Line 
                    type="monotone" 
                    dataKey="moisture" 
                    name="Product Moisture (%)" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    dot={{ r: 2 }}
                    activeDot={{ r: 6, fill: '#059669' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Fickian Thin-Layer Moisture Kinetics</span>
            <span>Relative Reduction: <strong className="text-emerald-700 font-mono">{relativeMoistureReductionPct.toFixed(1)}%</strong></span>
          </div>
        </div>

        {/* GRAPH 4: THERMAL EFFICIENCY / PERFORMANCE INDICATOR (Bar Chart) - Section E */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Thermal Performance Indicator — Simulated
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                Simulated Proxy
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Transparent, documented proxy based on temperature stability and setpoint deviation. Not physically measured thermal efficiency.
            </p>
          </div>

          <div className="h-64 w-full">
            {readings.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No telemetry recorded in the last 1 hour.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="timeLabel" 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`${val}%`, 'Thermal Stability Index']}
                  />
                  <ReferenceLine y={90} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Optimal: >90%', fill: '#10b981', fontSize: 10 }} />
                  <Bar 
                    dataKey="thermalIndicator" 
                    name="Thermal Stability Index (%)" 
                    fill="#f59e0b" 
                    radius={[3, 3, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Model: PID Setpoint Tracking Proxy</span>
            <span>Target Setpoint: <strong className="text-slate-700 font-mono">{tempSetpoint}°C</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
};
