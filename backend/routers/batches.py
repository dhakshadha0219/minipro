import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Batch, SensorReading, Alert, SystemSettings
from schemas import BatchCreate, BatchUpdate
from simulation import simulator

router = APIRouter(prefix="/api/batches", tags=["Batches"])

@router.get("")
def list_batches(
    status: Optional[str] = Query(None),
    product: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Batch)
    if status:
        query = query.filter(Batch.status == status)
    if product:
        query = query.filter(Batch.product_name.ilike(f"%{product}%"))

    batches = query.order_by(Batch.id.desc()).all()
    results = []
    
    for b in batches:
        # Calculate moisture reduction and duration
        duration_minutes = 0.0
        if b.start_time:
            end_t = b.end_time or datetime.datetime.utcnow()
            duration_minutes = round((end_t - b.start_time).total_seconds() / 60.0, 1)

        # Get latest reading for this batch or current
        latest_reading = db.query(SensorReading).filter(SensorReading.batch_id == b.batch_id).order_by(SensorReading.timestamp.desc()).first()
        current_moisture = latest_reading.moisture if latest_reading else b.initial_moisture
        
        moisture_reduction = round(max(0.0, b.initial_moisture - current_moisture), 1)

        progress = 0.0
        if b.initial_moisture > b.target_moisture:
            progress = round(min(100.0, max(0.0, ((b.initial_moisture - current_moisture) / (b.initial_moisture - b.target_moisture)) * 100.0)), 1)

        batch_dict = b.to_dict()
        batch_dict["duration_minutes"] = duration_minutes
        batch_dict["current_moisture"] = current_moisture
        batch_dict["moisture_reduction"] = moisture_reduction
        batch_dict["progress"] = progress
        results.append(batch_dict)

    return results

@router.post("")
def create_batch(data: BatchCreate, db: Session = Depends(get_db)):
    # Check if batch_id already exists
    existing = db.query(Batch).filter(Batch.batch_id == data.batch_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Batch ID '{data.batch_id}' already exists.")

    new_batch = Batch(
        batch_id=data.batch_id,
        product_name=data.product_name,
        initial_weight=data.initial_weight,
        initial_moisture=data.initial_moisture,
        target_moisture=data.target_moisture,
        temperature_setpoint=data.temperature_setpoint,
        status="CREATED",
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)

    return new_batch.to_dict()

@router.put("/{batch_id_or_id}")
def update_batch(batch_id_or_id: str, data: BatchUpdate, db: Session = Depends(get_db)):
    # Find by numeric id or batch_id string
    batch = None
    if batch_id_or_id.isdigit():
        batch = db.query(Batch).filter(Batch.id == int(batch_id_or_id)).first()
    if not batch:
        batch = db.query(Batch).filter(Batch.batch_id == batch_id_or_id).first()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    if data.product_name is not None:
        batch.product_name = data.product_name
    if data.initial_weight is not None:
        batch.initial_weight = data.initial_weight
    if data.initial_moisture is not None:
        batch.initial_moisture = data.initial_moisture
    if data.target_moisture is not None:
        batch.target_moisture = data.target_moisture
    if data.temperature_setpoint is not None:
        batch.temperature_setpoint = data.temperature_setpoint

    if data.status is not None:
        old_status = batch.status
        new_status = data.status.upper()
        batch.status = new_status

        if new_status == "RUNNING":
            # Safety Interlock: Verify door is CLOSED before starting/resuming dryer
            settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
            if settings and settings.door_state == "OPEN":
                raise HTTPException(
                    status_code=400,
                    detail="Cannot start dryer. Please close the door first."
                )

            if not batch.start_time:
                batch.start_time = datetime.datetime.utcnow()
            # If changing to RUNNING, pause any other running batches to keep 1 active chamber
            other_running = db.query(Batch).filter(Batch.id != batch.id, Batch.status == "RUNNING").all()
            for other in other_running:
                other.status = "PAUSED"
            
            # Reset simulator moisture to this batch's current or initial moisture
            simulator.moisture = batch.initial_moisture
            simulator.active_batch_id = batch.batch_id

            # Turn heater and fan on when starting/resuming batch with door closed
            if settings:
                settings.heater_state = "ON"
                settings.fan_state = "ON"
            
        elif new_status in ["COMPLETED", "STOPPED"]:
            if not batch.end_time:
                batch.end_time = datetime.datetime.utcnow()

    db.commit()
    db.refresh(batch)
    return batch.to_dict()

@router.get("/{batch_id_or_id}/details")
def get_batch_details(batch_id_or_id: str, db: Session = Depends(get_db)):
    batch = None
    if batch_id_or_id.isdigit():
        batch = db.query(Batch).filter(Batch.id == int(batch_id_or_id)).first()
    if not batch:
        batch = db.query(Batch).filter(Batch.batch_id == batch_id_or_id).first()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    # Fetch all readings strictly associated with this batch
    readings = db.query(SensorReading)\
        .filter(SensorReading.batch_id == batch.batch_id)\
        .order_by(SensorReading.timestamp.asc())\
        .all()

    total_readings = len(readings)
    
    # Calculate duration
    duration_minutes = 0.0
    if batch.start_time:
        end_t = batch.end_time or datetime.datetime.utcnow()
        duration_minutes = round((end_t - batch.start_time).total_seconds() / 60.0, 1)

    # Current or final moisture
    current_moisture = readings[-1].moisture if readings else batch.initial_moisture
    moisture_reduction = round(max(0.0, batch.initial_moisture - current_moisture), 2)
    relative_moisture_reduction = round(
        ((batch.initial_moisture - current_moisture) / batch.initial_moisture * 100.0) if batch.initial_moisture > 0 else 0.0,
        2
    )
    target_reached = bool(current_moisture <= batch.target_moisture)

    # Temperature & Humidity statistics
    if readings:
        temps = [r.temperature for r in readings]
        hums = [r.humidity for r in readings]
        avg_temp = round(sum(temps) / len(temps), 1)
        min_temp = round(min(temps), 1)
        max_temp = round(max(temps), 1)
        avg_hum = round(sum(hums) / len(hums), 1)
        min_hum = round(min(hums), 1)
        max_hum = round(max(hums), 1)
    else:
        avg_temp = batch.temperature_setpoint
        min_temp = batch.temperature_setpoint
        max_temp = batch.temperature_setpoint
        avg_hum = 45.0
        min_hum = 45.0
        max_hum = 45.0

    # Associated alerts
    batch_alerts = db.query(Alert)\
        .filter(Alert.batch_id == batch.batch_id)\
        .order_by(Alert.timestamp.desc())\
        .all()

    return {
        "batch": batch.to_dict(),
        "metrics": {
            "initial_weight": batch.initial_weight,
            "final_weight": None, # Stored accurately as None / Not Available per guidelines
            "initial_moisture": batch.initial_moisture,
            "current_moisture": current_moisture,
            "target_moisture": batch.target_moisture,
            "moisture_reduction": moisture_reduction,
            "relative_moisture_reduction": relative_moisture_reduction,
            "duration_minutes": duration_minutes,
            "total_readings": total_readings,
            "target_reached": target_reached,
            "avg_temperature": avg_temp,
            "min_temperature": min_temp,
            "max_temperature": max_temp,
            "avg_humidity": avg_hum,
            "min_humidity": min_hum,
            "max_humidity": max_hum,
            "data_source": "SIMULATION" if not readings else readings[0].data_source
        },
        "readings": [r.to_dict() for r in readings],
        "alerts": [a.to_dict() for a in batch_alerts]
    }

