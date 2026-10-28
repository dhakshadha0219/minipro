export interface SensorReading {
  id: number;
  timestamp: string;
  batch_id: string | null;
  temperature: number;
  humidity: number;
  moisture: number;
  data_source: string;
}

export interface Batch {
  id: number;
  batch_id: string;
  product_name: string;
  initial_weight: number;
  initial_moisture: number;
  target_moisture: number;
  temperature_setpoint: number;
  start_time: string | null;
  end_time: string | null;
  status: 'CREATED' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'COMPLETED';
  created_at?: string;
  progress?: number;
  duration_minutes?: number;
  current_moisture?: number;
  moisture_reduction?: number;
}

export interface Alert {
  id: number;
  timestamp: string;
  batch_id: string | null;
  parameter: string;
  value: number;
  threshold: number;
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'INFO';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  message: string;
}

export interface DigitalTwinState {
  heater: 'ON' | 'OFF';
  fan: 'ON' | 'OFF';
  airflow_mode: 'AUTO' | 'MANUAL';
  door: 'CLOSED' | 'OPEN';
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'COMPLETED';
  system_label: string;
  safety_interlock?: string;
  safety_alert?: string | null;
  interlock_notice?: string;
}

export interface SystemSettings {
  id?: number;
  temperature_normal_max: number;
  temperature_warning_max: number;
  temperature_critical_max: number;
  humidity_normal_max: number;
  humidity_warning_max: number;
  humidity_critical_max: number;
  moisture_target: number;
  monitoring_interval: number;
  heater_state: 'ON' | 'OFF';
  fan_state: 'ON' | 'OFF';
  airflow_mode: 'AUTO' | 'MANUAL';
  monitoring_enabled: boolean;
  door_state: 'CLOSED' | 'OPEN';
  updated_at?: string;
}

export interface DashboardState {
  sensor: SensorReading;
  batch: (Batch & { progress: number; elapsed_minutes: number }) | null;
  digital_twin: DigitalTwinState;
  settings: SystemSettings;
  recent_readings: SensorReading[];
  active_alerts: Alert[];
  active_alert_count: number;
  system_status: string;
}

export type PageRoute = 
  | 'workflow'
  | 'dashboard'
  | 'sensors'
  | 'analytics'
  | 'alerts'
  | 'history'
  | 'batches'
  | 'reports'
  | 'settings';
