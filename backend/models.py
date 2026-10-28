import datetime
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime
from database import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    batch_id = Column(String(50), nullable=True, index=True)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    moisture = Column(Float, nullable=False)
    data_source = Column(String(50), default="SIMULATION")

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "batch_id": self.batch_id,
            "temperature": round(self.temperature, 2),
            "humidity": round(self.humidity, 2),
            "moisture": round(self.moisture, 2),
            "data_source": self.data_source
        }

class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    batch_id = Column(String(50), unique=True, index=True, nullable=False)
    product_name = Column(String(100), nullable=False)
    initial_weight = Column(Float, nullable=False, default=10.0) # in kg
    initial_moisture = Column(Float, nullable=False, default=80.0) # in %
    target_moisture = Column(Float, nullable=False, default=20.0) # in %
    temperature_setpoint = Column(Float, nullable=False, default=55.0) # in °C
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default="CREATED") # CREATED, RUNNING, PAUSED, STOPPED, COMPLETED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "batch_id": self.batch_id,
            "product_name": self.product_name,
            "initial_weight": self.initial_weight,
            "initial_moisture": self.initial_moisture,
            "target_moisture": self.target_moisture,
            "temperature_setpoint": self.temperature_setpoint,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    batch_id = Column(String(50), nullable=True)
    parameter = Column(String(50), nullable=False) # Temperature, Humidity, Moisture, System
    value = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    severity = Column(String(20), nullable=False) # NORMAL, WARNING, CRITICAL, INFO
    status = Column(String(20), nullable=False, default="ACTIVE") # ACTIVE, ACKNOWLEDGED, RESOLVED
    message = Column(String(255), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "batch_id": self.batch_id,
            "parameter": self.parameter,
            "value": round(self.value, 2),
            "threshold": round(self.threshold, 2),
            "severity": self.severity,
            "status": self.status,
            "message": self.message
        }

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, default=1)
    temperature_normal_max = Column(Float, default=60.0)
    temperature_warning_max = Column(Float, default=65.0)
    temperature_critical_max = Column(Float, default=70.0)
    humidity_normal_max = Column(Float, default=60.0)
    humidity_warning_max = Column(Float, default=75.0)
    humidity_critical_max = Column(Float, default=85.0)
    moisture_target = Column(Float, default=20.0)
    monitoring_interval = Column(Integer, default=5) # seconds
    heater_state = Column(String(10), default="ON") # ON / OFF
    fan_state = Column(String(10), default="ON") # ON / OFF
    airflow_mode = Column(String(20), default="AUTO") # AUTO / MANUAL
    monitoring_enabled = Column(Boolean, default=True)
    door_state = Column(String(10), default="CLOSED") # CLOSED / OPEN
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "temperature_normal_max": self.temperature_normal_max,
            "temperature_warning_max": self.temperature_warning_max,
            "temperature_critical_max": self.temperature_critical_max,
            "humidity_normal_max": self.humidity_normal_max,
            "humidity_warning_max": self.humidity_warning_max,
            "humidity_critical_max": self.humidity_critical_max,
            "moisture_target": self.moisture_target,
            "monitoring_interval": self.monitoring_interval,
            "heater_state": self.heater_state,
            "fan_state": self.fan_state,
            "airflow_mode": self.airflow_mode,
            "monitoring_enabled": self.monitoring_enabled,
            "door_state": self.door_state,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
