import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  CheckCircle2, 
  Award, 
  Thermometer, 
  Droplets, 
  Clock, 
  Layers, 
  RefreshCw,
  Printer
} from 'lucide-react';
import { api } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [batchIdFilter, setBatchIdFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const [batchList, setBatchList] = useState<any[]>([]);

  useEffect(() => {
    api.getBatches().then(data => {
      if (Array.isArray(data)) setBatchList(data);
    }).catch(err => console.error('Failed to load batches list', err));
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await api.getReportSummary(batchIdFilter, productFilter);
      setReportData(data);
    } catch (err) {
      console.error('Failed to load report summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [batchIdFilter, productFilter]);

  const handleDownloadCsv = () => {
    window.location.href = api.getReportCsvUrl(batchIdFilter);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Report Scope:</span>
          </div>

          <select
            value={batchIdFilter}
            onChange={(e) => setBatchIdFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50"
          >
            <option value="ALL">All Batches</option>
            {batchList.length > 0 ? (
              batchList.map((b) => (
                <option key={b.id || b.batch_id} value={b.batch_id}>
                  Batch {b.batch_id} ({b.product_name})
                </option>
              ))
            ) : (
              <>
                <option value="B001">Batch B001</option>
                <option value="B002">Batch B002</option>
                <option value="B003">Batch B003</option>
              </>
            )}
          </select>

          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50"
          >
            <option value="ALL">All Products</option>
            <option value="Apple Slices">Apple Slices</option>
            <option value="Banana Chips">Banana Chips</option>
            <option value="Mango Strips">Mango Strips</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Generate Report</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {loading && !reportData ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-xs">Compiling bioprocess dehydration records...</p>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Report Meta Banner */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 border-t-4 border-t-blue-600">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Bioprocess Engineering Quality Assurance Report
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  Food Dehydration Facility Performance Audit
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generated from database telemetry records and thermodynamic Digital Twin engine
                </p>
              </div>

              <div className="text-right text-xs">
                <div className="font-mono font-bold text-slate-800">
                  DATE: {new Date().toLocaleDateString()}
                </div>
                <div className="text-slate-400 text-[11px]">
                  Facility: Commercial Food Dehydration Center
                </div>
              </div>
            </div>

            {/* Quality Summary & Process Summary Sections (Section #19) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              
              {/* 1. Quality Summary */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-bold text-sm">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Quality Summary</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">Initial Moisture (Average):</span>
                    <strong className="font-mono text-slate-900">{reportData.quality_summary.initial_moisture_avg} %</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">Final Moisture (Average):</span>
                    <strong className="font-mono text-slate-900">{reportData.quality_summary.final_moisture_avg} %</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">Net Moisture Reduction:</span>
                    <strong className="font-mono text-emerald-600 font-bold">-{reportData.quality_summary.moisture_reduction_avg} %</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">Average Drying Duration:</span>
                    <strong className="font-mono text-slate-900">{reportData.quality_summary.average_drying_duration_hours} Hours</strong>
                  </div>
                  <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Completed Batches / Total:</span>
                    <strong className="font-mono text-blue-600">{reportData.quality_summary.completed_batches} / {reportData.quality_summary.total_batches}</strong>
                  </div>
                </div>
              </div>

              {/* 2. Process Summary */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-bold text-sm">
                  <Thermometer className="w-4 h-4 text-red-500" />
                  <span>Process Summary</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">Average Chamber Temperature:</span>
                    <strong className="font-mono text-slate-900">{reportData.process_summary.average_temperature} °C</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">Average Relative Humidity:</span>
                    <strong className="font-mono text-slate-900">{reportData.process_summary.average_humidity} %</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">Temperature Standard Deviation:</span>
                    <strong className="font-mono text-slate-900">± {reportData.process_summary.temperature_deviation} °C</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">Humidity Standard Deviation:</span>
                    <strong className="font-mono text-slate-900">± {reportData.process_summary.humidity_deviation} %</strong>
                  </div>
                  <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Total Telemetry Data Points Analyzed:</span>
                    <strong className="font-mono text-blue-600">{reportData.process_summary.data_points_analyzed} readings</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Batch Summary Table (Section #19) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Batch Performance Summary Table
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {reportData.batch_summary.length} batches evaluated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Batch ID</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Initial %</th>
                    <th className="py-3 px-4">Final %</th>
                    <th className="py-3 px-4">Reduction</th>
                    <th className="py-3 px-4">Start Time</th>
                    <th className="py-3 px-4">End Time</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {reportData.batch_summary.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {b.batch_id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {b.product_name}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {b.initial_moisture}%
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {b.final_moisture}%
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                        -{b.moisture_reduction}%
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {b.start_time ? new Date(b.start_time).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {b.end_time ? new Date(b.end_time).toLocaleTimeString() : 'In Progress'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          b.status === 'RUNNING'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : b.status === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
