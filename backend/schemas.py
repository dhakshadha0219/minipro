from typing import Optional, List
from pydantic import BaseModel, Field

class SensorReadingBase(BaseModel):
    batch_id: Optional[str] = None
    temperature: float
    humidity: float
    moisture: float
    data_source: Optional[str] = "SIMULATION"

class SensorReadingCreate(SensorReadingBase):
    pass

class SensorReadingResponse(SensorReadingBase):
    id: int
    timestamp: str

    class Config:
        from_attributes = True

class BatchCreate(BaseModel):
    batch_id: str
    product_name: str
    initial_weight: float = Field(default=10.0, description="Initial weight in kg")
    initial_moisture: float = Field(default=80.0, description="Initial moisture in %")
    target_moisture: float = Field(default=20.0, description="Target moisture in %")
    temperature_setpoint: float = Field(default=55.0, description="Temperature setpoint in °C")

class BatchUpdate(BaseModel):
    product_name: Optional[str] = None
    status: Optional[str] = None # CREATED, RUNNING, PAUSED, STOPPED, COMPLETED
    initial_weight: Optional[float] = None
    initial_moisture: Optional[float] = None
    target_moisture: Optional[float] = None
    temperature_setpoint: Optional[float] = None

class BatchResponse(BaseModel):
    id: int
    batch_id: str
    product_name: str
    initial_weight: float
    initial_moisture: float
    target_moisture: float
    temperature_setpoint: float
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: str
    created_at: Optional[str] = None
    progress: Optional[float] = 0.0
    duration_minutes: Optional[float] = 0.0

class AlertResponse(BaseModel):
    id: int
    timestamp: str
    batch_id: Optional[str] = None
    parameter: str
    value: float
    threshold: float
    severity: str
    status: str
    message: str

class SettingsUpdate(BaseModel):
    temperature_normal_max: Optional[float] = None
    temperature_warning_max: Optional[float] = None
    temperature_critical_max: Optional[float] = None
    humidity_normal_max: Optional[float] = None
    humidity_warning_max: Optional[float] = None
    humidity_critical_max: Optional[float] = None
    moisture_target: Optional[float] = None
    monitoring_interval: Optional[int] = None
    heater_state: Optional[str] = None
    fan_state: Optional[str] = None
    airflow_mode: Optional[str] = None
    monitoring_enabled: Optional[bool] = None
    door_state: Optional[str] = None

class ActuatorControl(BaseModel):
    heater: Optional[str] = None # ON / OFF
    fan: Optional[str] = None # ON / OFF
    airflow: Optional[str] = None # AUTO / MANUAL
    monitoring: Optional[str] = None # START / STOP
    door: Optional[str] = None # OPEN / CLOSED

class LoginRequest(BaseModel):
    email: str
    password: str

class TwoFactorRequest(BaseModel):
    email: str
    code: str
