import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SensorReading, Batch, SystemSettings
from schemas import SensorReadingCreate
from simulation import simulator

router = APIRouter(prefix="/api/sensor", tags=["Sensors"])

@router.get("/latest")
def get_latest_sensor_reading(db: Session = Depends(get_db)):
    reading = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).first()
    if not reading:
        simulator.step(db)
        reading = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).first()
    
    if reading:
        return reading.to_dict()
    return {
        "id": 0,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "batch_id": None,
        "temperature": 55.2,
        "humidity": 42.0,
        "moisture": 31.0,
        "data_source": "SIMULATION"
    }

@router.get("/history")
def get_sensor_history(
    batch_id: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=2000),
    since_minutes: Optional[int] = Query(None, description="Fetch readings within the last N minutes"),
    data_source: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(SensorReading)
    if batch_id and batch_id != "ALL":
        query = query.filter(SensorReading.batch_id == batch_id)
    if data_source:
        query = query.filter(SensorReading.data_source == data_source)
    if since_minutes and since_minutes > 0:
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(minutes=since_minutes)
        query = query.filter(SensorReading.timestamp >= cutoff)

    readings = query.order_by(SensorReading.timestamp.desc()).limit(limit).all()
    # return chronologically sorted for easy chart consumption
    return [r.to_dict() for r in reversed(readings)]

@router.post("/data")
def receive_sensor_data(data: SensorReadingCreate, db: Session = Depends(get_db)):
    """
    Ingest sensor data from external sources (e.g. Arduino Uno R4 WiFi via Wi-Fi HTTP POST)
    or manual testing.
    """
    settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()

    # Determine batch
    batch_id = data.batch_id
    if not batch_id:
        active_batch = db.query(Batch).filter(Batch.status == "RUNNING").first()
        batch_id = active_batch.batch_id if active_batch else None

    reading = SensorReading(
        timestamp=datetime.datetime.utcnow(),
        batch_id=batch_id,
        temperature=round(data.temperature, 2),
        humidity=round(data.humidity, 2),
        moisture=round(data.moisture, 2),
        data_source=data.data_source or "ARDUINO_UNO_R4_WIFI"
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    # Sync simulator internal state so dashboard & twin reflect this new reading immediately
    simulator.temperature = reading.temperature
    simulator.humidity = reading.humidity
    simulator.moisture = reading.moisture
    simulator.last_reading = reading.to_dict()

    # Evaluate alerts
    if settings:
        simulator.evaluate_alerts(db, reading, settings)

    return {
        "status": "success",
        "message": "Sensor data recorded successfully",
        "reading": reading.to_dict()
    }
