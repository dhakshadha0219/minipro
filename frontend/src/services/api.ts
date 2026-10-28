import { DashboardState, SensorReading, Batch, Alert, SystemSettings } from '../types';

const BASE_URL = '/api';

export const api = {
  // Dashboard state
  async getDashboardState(): Promise<DashboardState> {
    const res = await fetch(`${BASE_URL}/dashboard/state`);
    if (!res.ok) throw new Error('Failed to fetch dashboard state');
    return res.json();
  },

  // Sensors
  async getLatestSensor(): Promise<SensorReading> {
    const res = await fetch(`${BASE_URL}/sensor/latest`);
    if (!res.ok) throw new Error('Failed to fetch latest sensor');
    return res.json();
  },

  async getSensorHistory(batchId?: string, limit = 200, sinceMinutes?: number): Promise<SensorReading[]> {
    const query = new URLSearchParams();
    if (batchId && batchId !== 'ALL') query.append('batch_id', batchId);
    query.append('limit', limit.toString());
    if (sinceMinutes) query.append('since_minutes', sinceMinutes.toString());
    const res = await fetch(`${BASE_URL}/sensor/history?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch sensor history');
    return res.json();
  },

  async getBatchDetails(batchIdOrId: string | number) {
    const res = await fetch(`${BASE_URL}/batches/${batchIdOrId}/details`);
    if (!res.ok) throw new Error('Failed to fetch batch details');
    return res.json();
  },

  async sendSensorData(data: { temperature: number; humidity: number; moisture: number; batch_id?: string; data_source?: string }) {
    const res = await fetch(`${BASE_URL}/sensor/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send sensor data');
    return res.json();
  },

  // Batches
  async getBatches(status?: string, product?: string): Promise<Batch[]> {
    const query = new URLSearchParams();
    if (status && status !== 'ALL') query.append('status', status);
    if (product) query.append('product', product);
    const res = await fetch(`${BASE_URL}/batches?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch batches');
    return res.json();
  },

  async createBatch(batch: {
    batch_id: string;
    product_name: string;
    initial_weight: number;
    initial_moisture: number;
    target_moisture: number;
    temperature_setpoint: number;
  }): Promise<Batch> {
    const res = await fetch(`${BASE_URL}/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create batch');
    }
    return res.json();
  },

  async updateBatch(batchIdOrId: string | number, update: Partial<Batch>): Promise<Batch> {
    const res = await fetch(`${BASE_URL}/batches/${batchIdOrId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error('Failed to update batch');
    return res.json();
  },

  // Alerts
  async getAlerts(status?: string, severity?: string, limit = 50): Promise<Alert[]> {
    const query = new URLSearchParams();
    if (status && status !== 'ALL') query.append('status', status);
    if (severity && severity !== 'ALL') query.append('severity', severity);
    query.append('limit', limit.toString());
    const res = await fetch(`${BASE_URL}/alerts?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async acknowledgeAlert(alertId: number): Promise<Alert> {
    const res = await fetch(`${BASE_URL}/alerts/${alertId}/acknowledge`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return res.json();
  },

  async resolveAlert(alertId: number): Promise<Alert> {
    const res = await fetch(`${BASE_URL}/alerts/${alertId}/resolve`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to resolve alert');
    return res.json();
  },

  async resolveAllAlerts(): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/alerts/resolve-all`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to resolve all alerts');
    return res.json();
  },

  // Settings & Control
  async getSettings(): Promise<SystemSettings> {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async controlActuator(controls: {
    heater?: 'ON' | 'OFF';
    fan?: 'ON' | 'OFF';
    airflow?: 'AUTO' | 'MANUAL';
    monitoring?: 'START' | 'STOP';
    door?: 'CLOSED' | 'OPEN';
  }) {
    const res = await fetch(`${BASE_URL}/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(controls),
    });
    if (!res.ok) throw new Error('Failed to send control command');
    return res.json();
  },

  // Reports
  async getReportSummary(batchId?: string, product?: string) {
    const query = new URLSearchParams();
    if (batchId && batchId !== 'ALL') query.append('batch_id', batchId);
    if (product && product !== 'ALL') query.append('product', product);
    const res = await fetch(`${BASE_URL}/reports/summary?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch report summary');
    return res.json();
  },

  getReportCsvUrl(batchId?: string): string {
    const query = new URLSearchParams();
    if (batchId && batchId !== 'ALL') query.append('batch_id', batchId);
    return `${BASE_URL}/reports/csv?${query.toString()}`;
  },

  // Auth Prototype
  async login(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async verify2FA(email: string, code: string) {
    const res = await fetch(`${BASE_URL}/auth/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Invalid verification code');
    }
    return res.json();
  }
};
