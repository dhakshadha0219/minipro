import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  AlertCircle, 
  Scale, 
  Droplets, 
  Thermometer, 
  Clock, 
  RefreshCw,
  X
} from 'lucide-react';
import { Batch } from '../types';
import { api } from '../services/api';

interface BatchManagementPageProps {
  onRefreshGlobalState: () => void;
}

export const BatchManagementPage: React.FC<BatchManagementPageProps> = ({
  onRefreshGlobalState
}) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // New batch form state
  const [newBatchId, setNewBatchId] = useState('');
  const [newProductName, setNewProductName] = useState('Banana Chips');
  const [newInitialWeight, setNewInitialWeight] = useState(10.0);
  const [newInitialMoisture, setNewInitialMoisture] = useState(75.0);
  const [newTargetMoisture, setNewTargetMoisture] = useState(18.0);
  const [newTempSetpoint, setNewTempSetpoint] = useState(58.0);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const data = await api.getBatches();
      setBatches(data);
    } catch (err) {
      console.error('Failed to load batches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    try {
      const bId = newBatchId.trim() || `B00${batches.length + 1}`;
      await api.createBatch({
        batch_id: bId,
        product_name: newProductName,
        initial_weight: Number(newInitialWeight),
        initial_moisture: Number(newInitialMoisture),
        target_moisture: Number(newTargetMoisture),
        temperature_setpoint: Number(newTempSetpoint)
      });
      setShowNewModal(false);
      setNewBatchId('');
      fetchBatches();
      onRefreshGlobalState();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create batch');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (batchId: string | number, status: 'RUNNING' | 'PAUSED' | 'STOPPED' | 'COMPLETED') => {
    if (status === 'RUNNING') {
      try {
        const sysSettings = await api.getSettings();
        if (sysSettings.door_state === 'OPEN') {
          alert('Cannot start dryer. Please close the door first.');
          return;
        }
      } catch {
        // continue to updateBatch
      }
    }
    try {
      await api.updateBatch(batchId, { status });
      fetchBatches();
      onRefreshGlobalState();
    } catch (err: any) {
      alert(err.message || 'Cannot start dryer. Please close the door first.');
    }
  };

  // Find currently RUNNING batch or most recently created
  const activeBatch = batches.find(b => b.status === 'RUNNING') || batches[0];

  return (
    <div className="space-y-6">
      {/* Top Header & New Batch Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Batch Dehydration Operations
          </h2>
          <p className="text-xs text-slate-500">
            Configure feedstock parameters, initiate drying cycles, and control batch lifecycle
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBatches}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setNewBatchId(`B00${batches.length + 1}`);
              setShowNewModal(true);
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Batch</span>
          </button>
        </div>
      </div>

      {/* Current Active Batch Card (Section #17) */}
      {activeBatch && (
        <div className="bg-gradient-to-br from-slate-900 via-navy-900 to-slate-950 text-white rounded-xl p-6 shadow-xl border border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-cyan-400 font-mono font-bold">
                    {activeBatch.batch_id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    activeBatch.status === 'RUNNING' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : activeBatch.status === 'PAUSED'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : activeBatch.status === 'COMPLETED'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    ● {activeBatch.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {activeBatch.product_name}
                </h3>
              </div>
            </div>

            {/* Lifecycle State Controls: Start, Pause, Resume, Stop, Complete (Section #17 & #18) */}
            <div className="flex items-center gap-2">
              {activeBatch.status !== 'RUNNING' && activeBatch.status !== 'COMPLETED' && (
                <button
                  onClick={() => handleUpdateStatus(activeBatch.batch_id, 'RUNNING')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start / Resume</span>
                </button>
              )}

              {activeBatch.status === 'RUNNING' && (
                <button
                  onClick={() => handleUpdateStatus(activeBatch.batch_id, 'PAUSED')}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition-all"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              )}

              {activeBatch.status !== 'STOPPED' && activeBatch.status !== 'COMPLETED' && (
                <button
                  onClick={() => handleUpdateStatus(activeBatch.batch_id, 'STOPPED')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1 transition-all"
                >
                  <Square className="w-3 h-3" />
                  <span>Stop</span>
                </button>
              )}

              {activeBatch.status !== 'COMPLETED' && (
                <button
                  onClick={() => handleUpdateStatus(activeBatch.batch_id, 'COMPLETED')}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Complete</span>
                </button>
              )}
            </div>
          </div>

          {/* Details & Progress Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-xs">
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Target Moisture</span>
              <strong className="text-white text-base font-mono">{activeBatch.target_moisture}%</strong>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Temperature Setpoint</span>
              <strong className="text-white text-base font-mono">{activeBatch.temperature_setpoint}°C</strong>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Initial Feedstock Weight</span>
              <strong className="text-white text-base font-mono">{activeBatch.initial_weight} kg</strong>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Drying Progress</span>
              <strong className="text-cyan-400 text-base font-mono">{activeBatch.progress || 0}%</strong>
            </div>
          </div>
        </div>
      )}

      {/* All Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Registered Facility Batches
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {batches.length} total batches
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Batch ID</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Weight (kg)</th>
                <th className="py-3 px-4">Initial %</th>
                <th className="py-3 px-4">Target %</th>
                <th className="py-3 px-4">Setpoint (°C)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">State Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">
                    {b.batch_id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {b.product_name}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {b.initial_weight}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {b.initial_moisture}%
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {b.target_moisture}%
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {b.temperature_setpoint}°C
                  </td>
                  <td className="py-3 px-4">
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
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {b.status !== 'RUNNING' && b.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleUpdateStatus(b.batch_id, 'RUNNING')}
                          className="p-1.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold"
                          title="Run batch"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {b.status === 'RUNNING' && (
                        <button
                          onClick={() => handleUpdateStatus(b.batch_id, 'PAUSED')}
                          className="p-1.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 text-[11px] font-semibold"
                          title="Pause batch"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {b.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleUpdateStatus(b.batch_id, 'COMPLETED')}
                          className="p-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold"
                          title="Mark completed"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Batch Modal (Section #17) */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  + Create New Dehydration Batch
                </h3>
                <p className="text-xs text-slate-500">
                  Register product parameters for drying chamber cycle
                </p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Batch ID (Unique)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B002"
                  value={newBatchId}
                  onChange={(e) => setNewBatchId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Product Name
                </label>
                <select
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 bg-slate-50"
                >
                  <option value="Banana Chips">Banana Chips</option>
                  <option value="Apple Slices">Apple Slices</option>
                  <option value="Mango Strips">Mango Strips</option>
                  <option value="Tomato Halves">Tomato Halves</option>
                  <option value="Herbal Leaves (Mint/Tulsi)">Herbal Leaves (Mint/Tulsi)</option>
                  <option value="Pineapple Rings">Pineapple Rings</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Initial Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={newInitialWeight}
                    onChange={(e) => setNewInitialWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Initial Moisture (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="25"
                    max="95"
                    required
                    value={newInitialMoisture}
                    onChange={(e) => setNewInitialMoisture(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Target Moisture (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="5"
                    max="40"
                    required
                    value={newTargetMoisture}
                    onChange={(e) => setNewTargetMoisture(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Temp Setpoint (°C)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="35"
                    max="75"
                    required
                    value={newTempSetpoint}
                    onChange={(e) => setNewTempSetpoint(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Create Batch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
