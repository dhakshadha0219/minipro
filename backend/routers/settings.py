import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SystemSettings, Batch, Alert
from schemas import SettingsUpdate, ActuatorControl

router = APIRouter(tags=["Settings & Control"])

def _trigger_door_open_interlock(db: Session, settings: SystemSettings):
    """
    Enforce Door Safety Interlock (Simulated):
    - Heater OFF immediately
    - Fan OFF immediately
    - Any active RUNNING batch changed to STOPPED
    - Door status set to OPEN
    - Safety Alert generated
    Notice: Simulated safety interlock. Physical hardware requires hardware-level safety interlock.
    """
    settings.door_state = "OPEN"
    settings.heater_state = "OFF"
    settings.fan_state = "OFF"

    # Stop all running batches
    running_batches = db.query(Batch).filter(Batch.status == "RUNNING").all()
    for b in running_batches:
        b.status = "STOPPED"
        if not b.end_time:
            b.end_time = datetime.datetime.utcnow()

    # Active safety alert
    existing_alert = db.query(Alert).filter(
        Alert.parameter == "Door Interlock",
        Alert.status == "ACTIVE"
    ).first()
    if not existing_alert:
        door_alert = Alert(
            timestamp=datetime.datetime.utcnow(),
            batch_id=running_batches[0].batch_id if running_batches else None,
            parameter="Door Interlock",
            value=1.0,
            threshold=0.0,
            severity="CRITICAL",
            status="ACTIVE",
            message="SAFETY ALERT: Door is open. Dryer stopped."
        )
        db.add(door_alert)

def _trigger_door_close_interlock(db: Session, settings: SystemSettings):
    """
    Door closed:
    - Door status set to CLOSED
    - Clear/resolve active door safety alert
    - DO NOT auto-restart dryer, heater, or fan
    """
    settings.door_state = "CLOSED"
    active_alerts = db.query(Alert).filter(
        Alert.parameter == "Door Interlock",
        Alert.status == "ACTIVE"
    ).all()
    for a in active_alerts:
        a.status = "RESOLVED"

@router.get("/api/settings")
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if not settings:
        settings = SystemSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings.to_dict()

@router.put("/api/settings")
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db)):
    settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if not settings:
        settings = SystemSettings(id=1)
        db.add(settings)

    # Handle door state change first
    if data.door_state is not None:
        target_door = data.door_state.upper()
        if target_door == "OPEN":
            _trigger_door_open_interlock(db, settings)
        elif target_door == "CLOSED":
            _trigger_door_close_interlock(db, settings)

    # Check interlock restrictions if door is open
    if settings.door_state == "OPEN":
        if data.heater_state is not None and data.heater_state.upper() == "ON":
            raise HTTPException(
                status_code=400,
                detail="Cannot start heater. Please close the door first."
            )
        if data.fan_state is not None and data.fan_state.upper() == "ON":
            raise HTTPException(
                status_code=400,
                detail="Cannot start fan. Please close the door first."
            )

    if data.temperature_normal_max is not None:
        settings.temperature_normal_max = data.temperature_normal_max
    if data.temperature_warning_max is not None:
        settings.temperature_warning_max = data.temperature_warning_max
    if data.temperature_critical_max is not None:
        settings.temperature_critical_max = data.temperature_critical_max
    if data.humidity_normal_max is not None:
        settings.humidity_normal_max = data.humidity_normal_max
    if data.humidity_warning_max is not None:
        settings.humidity_warning_max = data.humidity_warning_max
    if data.humidity_critical_max is not None:
        settings.humidity_critical_max = data.humidity_critical_max
    if data.moisture_target is not None:
        settings.moisture_target = data.moisture_target
    if data.monitoring_interval is not None:
        settings.monitoring_interval = max(1, data.monitoring_interval)
    if data.heater_state is not None and settings.door_state != "OPEN":
        settings.heater_state = data.heater_state.upper()
    if data.fan_state is not None and settings.door_state != "OPEN":
        settings.fan_state = data.fan_state.upper()
    if data.airflow_mode is not None:
        settings.airflow_mode = data.airflow_mode.upper()
    if data.monitoring_enabled is not None:
        settings.monitoring_enabled = data.monitoring_enabled

    db.commit()
    db.refresh(settings)
    return settings.to_dict()

@router.post("/api/control")
def control_actuators(ctrl: ActuatorControl, db: Session = Depends(get_db)):
    settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if not settings:
        settings = SystemSettings(id=1)
        db.add(settings)

    # 1. Door Interlock Actuation
    if ctrl.door is not None:
        target_door = ctrl.door.upper()
        if target_door == "OPEN":
            _trigger_door_open_interlock(db, settings)
        elif target_door == "CLOSED":
            _trigger_door_close_interlock(db, settings)

    # 2. Interlock verification: If door is open, heater and fan MUST NOT be turned ON
    if settings.door_state == "OPEN":
        if ctrl.heater is not None and ctrl.heater.upper() == "ON":
            raise HTTPException(
                status_code=400,
                detail="Cannot start heater. Please close the door first."
            )
        if ctrl.fan is not None and ctrl.fan.upper() == "ON":
            raise HTTPException(
                status_code=400,
                detail="Cannot start fan. Please close the door first."
            )

    # 3. Apply other actuator updates
    if ctrl.heater is not None:
        if settings.door_state == "OPEN":
            settings.heater_state = "OFF"
        else:
            settings.heater_state = ctrl.heater.upper()

    if ctrl.fan is not None:
        if settings.door_state == "OPEN":
            settings.fan_state = "OFF"
        else:
            settings.fan_state = ctrl.fan.upper()

    if ctrl.airflow is not None:
        settings.airflow_mode = ctrl.airflow.upper()
    if ctrl.monitoring is not None:
        settings.monitoring_enabled = (ctrl.monitoring.upper() == "START")

    db.commit()
    db.refresh(settings)
    return {
        "status": "success",
        "message": "Actuator control updated in simulation mode (Simulated Safety Interlock)",
        "actuators": {
            "heater": settings.heater_state,
            "fan": settings.fan_state,
            "airflow": settings.airflow_mode,
            "monitoring": "RUNNING" if settings.monitoring_enabled else "STOPPED",
            "door": settings.door_state
        },
        "safety_interlock": {
            "status": "TRIPPED" if settings.door_state == "OPEN" else "ENGAGED",
            "message": "SAFETY ALERT: Door is open. Dryer stopped." if settings.door_state == "OPEN" else "Interlock Ready (Door Closed)",
            "notice": "Simulated safety interlock. Physical hardware integration requires dedicated hardware-level safety interlock."
        },
        "hardware_notice": "Simulation Control Mode. Physical actuator control requires future Arduino integration."
    }
