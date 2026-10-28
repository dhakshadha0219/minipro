import io
import csv
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from database import get_db
from models import Batch, SensorReading, Alert

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/summary")
def get_report_summary(
    batch_id: Optional[str] = Query(None),
    product: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Batch)
    if batch_id and batch_id != "ALL":
        query = query.filter(Batch.batch_id == batch_id)
    if product and product != "ALL":
        query = query.filter(Batch.product_name.ilike(f"%{product}%"))

    batches = query.order_by(Batch.id.desc()).all()

    # Calculate overall aggregates across filtered batches
    total_batches = len(batches)
    completed_batches = len([b for b in batches if b.status == "COMPLETED"])

    # Sensor readings for selected batch or all recent
    sensor_query = db.query(SensorReading)
    if batch_id and batch_id != "ALL":
        sensor_query = sensor_query.filter(SensorReading.batch_id == batch_id)

    readings = sensor_query.order_by(SensorReading.timestamp.desc()).limit(500).all()

    avg_temp = round(sum(r.temperature for r in readings) / len(readings), 1) if readings else 55.2
    avg_hum = round(sum(r.humidity for r in readings) / len(readings), 1) if readings else 42.0

    # Temperature and humidity deviations (std dev approx)
    temp_dev = 0.0
    hum_dev = 0.0
    if len(readings) > 1:
        temp_dev = round((sum((r.temperature - avg_temp) ** 2 for r in readings) / len(readings)) ** 0.5, 2)
        hum_dev = round((sum((r.humidity - avg_hum) ** 2 for r in readings) / len(readings)) ** 0.5, 2)

    # Batch summary items
    batch_summaries = []
    total_moisture_reduced = 0.0
    total_duration_hours = 0.0

    for b in batches:
        duration_minutes = 0.0
        if b.start_time:
            end_t = b.end_time or datetime.datetime.utcnow()
            duration_minutes = round((end_t - b.start_time).total_seconds() / 60.0, 1)

        b_readings = [r for r in readings if r.batch_id == b.batch_id]
        final_moist = b_readings[0].moisture if b_readings else b.target_moisture
        moist_red = round(max(0.0, b.initial_moisture - final_moist), 1)
        total_moisture_reduced += moist_red
        total_duration_hours += duration_minutes / 60.0

        batch_summaries.append({
            "id": b.id,
            "batch_id": b.batch_id,
            "product_name": b.product_name,
            "initial_weight": b.initial_weight,
            "initial_moisture": b.initial_moisture,
            "final_moisture": final_moist,
            "target_moisture": b.target_moisture,
            "moisture_reduction": moist_red,
            "temperature_setpoint": b.temperature_setpoint,
            "duration_minutes": duration_minutes,
            "start_time": b.start_time.isoformat() if b.start_time else None,
            "end_time": b.end_time.isoformat() if b.end_time else None,
            "status": b.status
        })

    avg_moisture_reduction = round(total_moisture_reduced / total_batches, 1) if total_batches > 0 else 0.0
    avg_duration_hours = round(total_duration_hours / total_batches, 1) if total_batches > 0 else 0.0

    return {
        "quality_summary": {
            "initial_moisture_avg": round(sum(b.initial_moisture for b in batches) / total_batches, 1) if total_batches else 80.0,
            "final_moisture_avg": round(sum(b["final_moisture"] for b in batch_summaries) / total_batches, 1) if total_batches else 20.0,
            "moisture_reduction_avg": avg_moisture_reduction,
            "average_drying_duration_hours": avg_duration_hours,
            "completed_batches": completed_batches,
            "total_batches": total_batches
        },
        "process_summary": {
            "average_temperature": avg_temp,
            "average_humidity": avg_hum,
            "temperature_deviation": temp_dev,
            "humidity_deviation": hum_dev,
            "data_points_analyzed": len(readings)
        },
        "batch_summary": batch_summaries
    }

@router.get("/csv")
def download_csv_report(
    batch_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    output = io.StringIO()
    writer = csv.writer(output)
    now_iso = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    # SECTION 1: REPORT HEADER
    writer.writerow(["================================================================="])
    writer.writerow(["DRYER TWIN — FOOD DEHYDRATION MONITORING REPORT"])
    writer.writerow(["Commercial Food Dehydration Facility Digital Twin"])
    writer.writerow([f"Generated At: {now_iso}"])
    writer.writerow(["Data Source: Simulated Sensor Telemetry (Prototype Mode)"])
    writer.writerow(["Hardware Integration Scope: Arduino Uno R4 WiFi (Future Scope)"])
    writer.writerow(["================================================================="])
    writer.writerow([])

    # If specific batch requested
    if batch_id and batch_id != "ALL":
        batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
        readings = db.query(SensorReading)\
            .filter(SensorReading.batch_id == batch_id)\
            .order_by(SensorReading.timestamp.asc())\
            .all()

        if batch:
            duration_minutes = 0.0
            if batch.start_time:
                end_t = batch.end_time or datetime.datetime.utcnow()
                duration_minutes = round((end_t - batch.start_time).total_seconds() / 60.0, 1)

            current_moisture = readings[-1].moisture if readings else batch.initial_moisture
            moisture_reduction = round(max(0.0, batch.initial_moisture - current_moisture), 2)
            rel_moisture_reduction = round(
                ((batch.initial_moisture - current_moisture) / batch.initial_moisture * 100.0) if batch.initial_moisture > 0 else 0.0,
                2
            )

            writer.writerow(["[BATCH IDENTIFICATION & PARAMETERS]"])
            writer.writerow(["Batch ID", batch.batch_id])
            writer.writerow(["Product Name", batch.product_name])
            writer.writerow(["Status", batch.status])
            writer.writerow(["Initial Weight (kg)", batch.initial_weight])
            writer.writerow(["Final Weight (kg)", "Not available"])
            writer.writerow(["Initial Moisture (%)", batch.initial_moisture])
            writer.writerow([
                "Current Moisture (%)" if batch.status == "RUNNING" else "Final Moisture (%)",
                current_moisture
            ])
            writer.writerow(["Target Moisture (%)", batch.target_moisture])
            writer.writerow(["Temperature Setpoint (°C)", batch.temperature_setpoint])
            writer.writerow(["Start Time", batch.start_time.isoformat() if batch.start_time else "Not available"])
            writer.writerow(["End Time", batch.end_time.isoformat() if batch.end_time else ("In Progress" if batch.status == "RUNNING" else "Not available")])
            writer.writerow(["Drying Duration", f"{duration_minutes} minutes" if duration_minutes > 0 else "Not available"])
            writer.writerow(["Target Moisture Reached", "YES" if current_moisture <= batch.target_moisture else "NO"])
            writer.writerow([])

            if readings:
                temps = [r.temperature for r in readings]
                hums = [r.humidity for r in readings]
                writer.writerow(["[PROCESS TELEMETRY SUMMARY]"])
                writer.writerow(["Metric", "Average", "Minimum", "Maximum", "Units"])
                writer.writerow(["Temperature", round(sum(temps) / len(temps), 1), round(min(temps), 1), round(max(temps), 1), "°C"])
                writer.writerow(["Humidity", round(sum(hums) / len(hums), 1), round(min(hums), 1), round(max(hums), 1), "%"])
                writer.writerow(["Moisture Reduction (Points)", moisture_reduction, "", "", "% points"])
                writer.writerow(["Relative Moisture Reduction", rel_moisture_reduction, "", "", "% of initial"])
                writer.writerow(["Total Data Points Logged", len(readings), "", "", "readings"])
                writer.writerow([])

            # Associated batch alerts
            alerts = db.query(Alert).filter(Alert.batch_id == batch_id).all()
            if alerts:
                writer.writerow(["[ASSOCIATED SYSTEM ALERTS]"])
                writer.writerow(["Timestamp", "Severity", "Parameter", "Trigger Value", "Threshold", "Status", "Message"])
                for a in alerts:
                    writer.writerow([
                        a.timestamp.isoformat() if a.timestamp else "",
                        a.severity,
                        a.parameter,
                        a.value,
                        a.threshold,
                        a.status,
                        a.message
                    ])
                writer.writerow([])
    else:
        # OVERALL REPORT ACROSS ALL BATCHES
        batches = db.query(Batch).order_by(Batch.id.desc()).all()
        readings = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).limit(1000).all()

        writer.writerow(["[FACILITY BATCH SUMMARY TABLE]"])
        writer.writerow([
            "Batch ID", "Product Name", "Status", "Initial Weight (kg)", "Final Weight",
            "Initial Moisture (%)", "Current/Final Moisture (%)", "Target Moisture (%)",
            "Setpoint (°C)", "Start Time", "End Time", "Duration (mins)"
        ])
        for b in batches:
            b_readings = [r for r in readings if r.batch_id == b.batch_id]
            final_m = b_readings[0].moisture if b_readings else b.target_moisture
            dur = 0.0
            if b.start_time:
                end_t = b.end_time or datetime.datetime.utcnow()
                dur = round((end_t - b.start_time).total_seconds() / 60.0, 1)

            writer.writerow([
                b.batch_id,
                b.product_name,
                b.status,
                b.initial_weight,
                "Not available",
                b.initial_moisture,
                final_m,
                b.target_moisture,
                b.temperature_setpoint,
                b.start_time.isoformat() if b.start_time else "Not available",
                b.end_time.isoformat() if b.end_time else ("In Progress" if b.status == "RUNNING" else "Not available"),
                dur if dur > 0 else "Not available"
            ])
        writer.writerow([])

    # SECTION: DETAILED SENSOR READINGS TABLE
    writer.writerow(["[TIMESTAMPED SENSOR TELEMETRY LOG]"])
    writer.writerow(["ID", "Timestamp (UTC)", "Batch ID", "Temperature (°C)", "Humidity (%)", "Moisture (%)", "Data Source"])
    for r in readings:
        writer.writerow([
            r.id,
            r.timestamp.isoformat() if r.timestamp else "",
            r.batch_id or "N/A",
            r.temperature,
            r.humidity,
            r.moisture,
            r.data_source
        ])

    csv_content = output.getvalue()
    prefix = f"dryer_twin_batch_{batch_id}" if batch_id and batch_id != "ALL" else "dryer_twin_overall_report"
    filename = f"{prefix}_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
