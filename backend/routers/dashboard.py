import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import SensorReading, Batch, Alert, SystemSettings
from simulation import simulator

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/state")
def get_dashboard_state(db: Session = Depends(get_db)):
    # 1. Fetch System Settings
    settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if not settings:
        simulator.initialize_state(db)
        settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()

    # 2. Latest Sensor Reading
    latest_reading = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).first()
    if not latest_reading:
        simulator.step(db)
        latest_reading = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).first()

    latest_data = latest_reading.to_dict() if latest_reading else {
        "temperature": simulator.temperature,
        "humidity": simulator.humidity,
        "moisture": simulator.moisture,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "data_source": "SIMULATION"
    }

    # 3. Active Batch
    active_batch = db.query(Batch).filter(Batch.status == "RUNNING").first()
    if not active_batch:
        active_batch = db.query(Batch).order_by(Batch.id.desc()).first()

    batch_data = None
    progress = 0.0
    elapsed_minutes = 0.0

    if active_batch:
        # Calculate drying progress %: (initial - current) / (initial - target) * 100
        init_m = active_batch.initial_moisture
        target_m = active_batch.target_moisture
        curr_m = latest_data["moisture"]

        if init_m > target_m:
            raw_progress = ((init_m - curr_m) / (init_m - target_m)) * 100.0
            progress = max(0.0, min(100.0, round(raw_progress, 1)))
        else:
            progress = 0.0

        if active_batch.start_time:
            now = datetime.datetime.utcnow()
            elapsed_minutes = max(0.0, round((now - active_batch.start_time).total_seconds() / 60.0, 1))

        batch_data = {
            "id": active_batch.id,
            "batch_id": active_batch.batch_id,
            "product_name": active_batch.product_name,
            "initial_weight": active_batch.initial_weight,
            "initial_moisture": active_batch.initial_moisture,
            "target_moisture": active_batch.target_moisture,
            "temperature_setpoint": active_batch.temperature_setpoint,
            "start_time": active_batch.start_time.isoformat() if active_batch.start_time else None,
            "status": active_batch.status,
            "progress": progress,
            "elapsed_minutes": elapsed_minutes
        }

    # 4. Overall Health Status (Door Interlock has highest priority)
    twin_status = "NORMAL"
    if settings and settings.door_state == "OPEN":
        twin_status = "CRITICAL"
    elif active_batch and active_batch.status == "COMPLETED":
        twin_status = "COMPLETED"
    elif latest_data["temperature"] > (settings.temperature_critical_max if settings else 70.0) or \
         latest_data["humidity"] > (settings.humidity_critical_max if settings else 85.0):
        twin_status = "CRITICAL"
    elif latest_data["temperature"] > (settings.temperature_warning_max if settings else 60.0) or \
         latest_data["humidity"] > (settings.humidity_warning_max if settings else 75.0):
        twin_status = "WARNING"

    # 5. Recent readings for live sparklines / trends (last 15 points)
    recent_readings = db.query(SensorReading)\
        .order_by(SensorReading.timestamp.desc())\
        .limit(15)\
        .all()
    recent_readings = [r.to_dict() for r in reversed(recent_readings)]

    # 6. Active Alerts Count & Recent Alerts
    active_alerts = db.query(Alert)\
        .filter(Alert.status == "ACTIVE")\
        .order_by(Alert.timestamp.desc())\
        .limit(5)\
        .all()

    alert_count = db.query(Alert).filter(Alert.status == "ACTIVE").count()

    is_door_open = bool(settings and settings.door_state == "OPEN")

    return {
        "sensor": latest_data,
        "batch": batch_data,
        "digital_twin": {
            "heater": settings.heater_state if settings else "ON",
            "fan": settings.fan_state if settings else "ON",
            "airflow_mode": settings.airflow_mode if settings else "AUTO",
            "door": settings.door_state if settings else "CLOSED",
            "status": twin_status,
            "safety_interlock": "TRIPPED" if is_door_open else "ENGAGED",
            "safety_alert": "SAFETY ALERT: Door is open. Dryer stopped." if is_door_open else None,
            "interlock_notice": "Simulated Safety Interlock. Physical hardware requires hardware-level safety interlock.",
            "system_label": "Demo Simulation"
        },
        "settings": settings.to_dict() if settings else {},
        "recent_readings": recent_readings,
        "active_alerts": [a.to_dict() for a in active_alerts],
        "active_alert_count": alert_count,
        "system_status": "Demo Simulation"
    }
