import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  X, 
  Calendar, 
  Clock, 
  Layers, 
  Activity, 
  Thermometer, 
  Droplets,
  CheckCircle2,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  Scale,
  Target,
  Zap,
  Info,
  TrendingUp
} from 'lucide-react';
import { Batch, SensorReading } from '../types';
import { api } from '../services/api';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  Legend
} from 'recharts';

export const HistoryPage: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchDetailsData, setBatchDetailsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeGraphTab, setActiveGraphTab] = useState<'combined' | 'temp' | 'hum' | 'moist'>('combined');

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const data = await api.getBatches(
        statusFilter === 'ALL' ? undefined : statusFilter,
        productFilter === 'ALL' ? undefined : productFilter
      );
      setBatches(data);
    } catch (err) {
      console.error('Failed to fetch batches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [statusFilter, productFilter]);

  const loadBatchDetails = async (batchId: string, isPolling = false) => {
    if (!isPolling) setLoadingDetails(true);
    try {
      const details = await api.getBatchDetails(batchId);
      setBatchDetailsData(details);
    } catch (err) {
      console.error('Failed to load batch details', err);
    } finally {
      if (!isPolling) setLoadingDetails(false);
    }
  };

  const handleViewBatch = async (batch: Batch) => {
    setSelectedBatch(batch);
    await loadBatchDetails(batch.batch_id, false);
  };

  // Auto-refresh batch readings if the selected batch is currently RUNNING
  useEffect(() => {
    if (!selectedBatch || selectedBatch.status !== 'RUNNING') return;
    const interval = setInterval(() => {
      loadBatchDetails(selectedBatch.batch_id, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedBatch]);

  const handleExportBatchCsv = (batchId?: string) => {
    const id = batchId || selectedBatch?.batch_id;
    if (id) {
      window.location.href = api.getReportCsvUrl(id);
    }
  };

  const handlePrintBatchReport = () => {
    window.print();
  };

  // Filter batches by search query
  const filteredBatches = batches.filter(b => 
    b.batch_id.toLowerCase().includes(search.toLowerCase()) ||
    b.product_name.toLowerCase().includes(search.toLowerCase())
  );

  const batchReadings: SensorReading[] = batchDetailsData?.readings || [];
  const metrics = batchDetailsData?.metrics || null;
  const isBatchRunning = selectedBatch?.status === 'RUNNING';

  // Format readings for charts with readable times
  const chartPoints = batchReadings.map(r => ({
    ...r,
    timeLabel: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }));

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Batch ID or Product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 w-60"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50"
          >
            <option value="ALL">All Statuses</option>
            <option value="RUNNING">RUNNING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="PAUSED">PAUSED</option>
            <option value="STOPPED">STOPPED</option>
          </select>

          {/* Product Filter */}
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50"
          >
            <option value="ALL">All Products</option>
            <option value="Apple Slices">Apple Slices</option>
            <option value="Banana Chips">Banana Chips</option>
            <option value="Mango Strips">Mango Strips</option>
            <option value="Tomato Halves">Tomato Halves</option>
          </select>
        </div>

        {/* Buttons: Refresh & Export All */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBatches}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => handleExportBatchCsv('ALL')}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Overall CSV</span>
          </button>
        </div>
      </div>

      {/* History Table (Clickable Rows & View Details) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            Commercial Dehydration Batch Records
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {filteredBatches.length} records available • Click row for full dossier
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Batch ID</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Moisture Reduction</th>
                <th className="py-3 px-4">Initial %</th>
                <th className="py-3 px-4">Target %</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No matching dehydration records found.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => (
                  <tr 
                    key={b.id} 
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    onClick={() => handleViewBatch(b)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 group-hover:underline">
                      {b.batch_id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {b.product_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {b.start_time ? new Date(b.start_time).toLocaleString() : 'Not started'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {b.duration_minutes ? `${b.duration_minutes} mins` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 font-bold">
                      {b.moisture_reduction ? `-${b.moisture_reduction}%` : `${Math.max(0, b.initial_moisture - (b.current_moisture || b.target_moisture)).toFixed(1)}%`}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {b.initial_moisture}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {b.target_moisture}%
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        b.status === 'RUNNING'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : b.status === 'COMPLETED'
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : b.status === 'PAUSED'
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewBatch(b);
                        }}
                        className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs inline-flex items-center gap-1 shadow-sm"
                        title="View Detailed Dossier & Graphs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPREHENSIVE BATCH DETAILS & SENSOR GRAPHS MODAL (Change 3) */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider font-mono">
                      Batch Dossier: {selectedBatch.batch_id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      selectedBatch.status === 'RUNNING'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : selectedBatch.status === 'COMPLETED'
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {selectedBatch.status}
                    </span>
                    {isBatchRunning && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        Live Updating
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                    {selectedBatch.product_name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportBatchCsv(selectedBatch.batch_id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                  title="Download Batch CSV Report"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
                <button
                  onClick={handlePrintBatchReport}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
                  title="Print Batch Report"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button 
                  onClick={() => setSelectedBatch(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loadingDetails && !batchDetailsData ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-xs">Loading batch telemetry and performance calculations...</p>
              </div>
            ) : (
              <>
                {/* SECTION B: BATCH INFORMATION GRID */}
                <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    Batch Metadata & Recorded Parameters
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Initial Feedstock Weight</span>
                      <strong className="text-slate-800 text-sm font-mono">{selectedBatch.initial_weight} kg</strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Final Product Weight</span>
                      <strong className="text-slate-500 text-sm font-mono italic">
                        {metrics?.final_weight || 'Not available'}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Initial Moisture Content</span>
                      <strong className="text-slate-800 text-sm font-mono">{selectedBatch.initial_moisture} %</strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">
                        {isBatchRunning ? 'Current Moisture' : 'Final Moisture'}
                      </span>
                      <strong className="text-emerald-700 text-sm font-mono font-bold">
                        {metrics ? `${metrics.current_moisture} %` : `${selectedBatch.target_moisture}%`}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Target Moisture Setpoint</span>
                      <strong className="text-slate-800 text-sm font-mono">{selectedBatch.target_moisture} %</strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Temperature Setpoint</span>
                      <strong className="text-slate-800 text-sm font-mono">{selectedBatch.temperature_setpoint} °C</strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Start Time</span>
                      <span className="text-slate-800 text-[11px] font-mono block">
                        {selectedBatch.start_time ? new Date(selectedBatch.start_time).toLocaleString() : 'Not available'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">End Time</span>
                      <span className="text-slate-800 text-[11px] font-mono block">
                        {selectedBatch.end_time 
                          ? new Date(selectedBatch.end_time).toLocaleString() 
                          : (isBatchRunning ? 'In Progress' : 'Not available')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                    <span>Total Telemetry Readings: <strong className="text-slate-800 font-mono">{metrics?.total_readings || batchReadings.length}</strong></span>
                    <span>Drying Duration: <strong className="text-slate-800 font-mono">{metrics?.duration_minutes || 0} minutes</strong></span>
                    <span>Data Source: <strong className="text-blue-700 font-mono">{metrics?.data_source || 'SIMULATION'}</strong></span>
                  </div>
                </div>

                {/* SECTION D: BATCH PERFORMANCE SUMMARY */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    Batch Performance & Moisture Reduction Summary
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">Moisture Reduction</span>
                      <span className="text-emerald-700 font-bold font-mono text-sm">
                        -{metrics?.moisture_reduction || 0} % points
                      </span>
                    </div>

                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">Relative Moisture Loss</span>
                      <span className="text-emerald-700 font-bold font-mono text-sm">
                        {metrics?.relative_moisture_reduction || 0} %
                      </span>
                    </div>

                    <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">Avg / Min / Max Temp</span>
                      <span className="text-slate-800 font-mono text-xs font-bold">
                        {metrics?.avg_temperature}°C ({metrics?.min_temperature}° - {metrics?.max_temperature}°)
                      </span>
                    </div>

                    <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">Target Reached</span>
                      <span className={`font-bold font-mono text-xs ${metrics?.target_reached ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {metrics?.target_reached ? 'YES (Completed)' : (isBatchRunning ? 'IN PROGRESS' : 'NO')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION C: BATCH-SPECIFIC SENSOR GRAPHS (ONLY this batch's readings) */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                        Dedicated Telemetry Trends for Batch {selectedBatch.batch_id} ({selectedBatch.product_name})
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Graphs contain only recorded sensor readings for this batch
                      </p>
                    </div>

                    {/* Graph Switcher Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                      <button
                        onClick={() => setActiveGraphTab('combined')}
                        className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-all ${
                          activeGraphTab === 'combined' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Combined Trend
                      </button>
                      <button
                        onClick={() => setActiveGraphTab('temp')}
                        className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-all ${
                          activeGraphTab === 'temp' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Temperature
                      </button>
                      <button
                        onClick={() => setActiveGraphTab('hum')}
                        className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-all ${
                          activeGraphTab === 'hum' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Humidity
                      </button>
                      <button
                        onClick={() => setActiveGraphTab('moist')}
                        className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-all ${
                          activeGraphTab === 'moist' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Moisture
                      </button>
                    </div>
                  </div>

                  {/* Graph Canvas */}
                  <div className="h-60 w-full pt-2">
                    {chartPoints.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400">
                        <Info className="w-6 h-6 mb-1 text-slate-300" />
                        <span>No historical readings logged for batch {selectedBatch.batch_id} yet.</span>
                      </div>
                    ) : activeGraphTab === 'combined' ? (
                      /* Graph 4: Combined Trend */
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartPoints}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: '#64748b' }} />
                          <YAxis domain={[10, 95]} tick={{ fontSize: 10, fill: '#64748b' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#ef4444" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="humidity" name="RH (%)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="moisture" name="Moisture (%)" stroke="#10b981" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : activeGraphTab === 'temp' ? (
                      /* Graph 1: Temperature vs Time */
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartPoints}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: '#64748b' }} />
                          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} unit="°C" />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                          <ReferenceLine y={selectedBatch.temperature_setpoint} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: `Setpoint: ${selectedBatch.temperature_setpoint}°C`, fill: '#3b82f6', fontSize: 10 }} />
                          <Line type="monotone" dataKey="temperature" name="Chamber Temp (°C)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : activeGraphTab === 'hum' ? (
                      /* Graph 2: Humidity vs Time */
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartPoints}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: '#64748b' }} />
                          <YAxis domain={[10, 95]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                          <Area type="monotone" dataKey="humidity" name="Relative Humidity (%)" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      /* Graph 3: Moisture vs Time */
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartPoints}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: '#64748b' }} />
                          <YAxis domain={[10, 95]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                          <ReferenceLine y={selectedBatch.target_moisture} stroke="#10b981" strokeDasharray="3 3" label={{ value: `Target: ${selectedBatch.target_moisture}%`, fill: '#059669', fontSize: 10 }} />
                          <Line type="monotone" dataKey="moisture" name="Sample Moisture (%)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
              <span className="text-slate-400 font-mono">
                Batch Traceability ID: {selectedBatch.batch_id} • System Status: {selectedBatch.status}
              </span>
              <button
                onClick={() => setSelectedBatch(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
