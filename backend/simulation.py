import math
import random
import datetime
from sqlalchemy.orm import Session
from database import SessionLocal
from models import SensorReading, Batch, Alert, SystemSettings

class DehydrationSimulator:
    def __init__(self):
        self.temperature = 55.2
        self.humidity = 42.0
        self.moisture = 72.0
        self.ambient_temp = 25.0
        self.ambient_humidity = 58.0
        self.step_count = 0
        self.last_reading = None
        self.active_batch_id = None

    def initialize_state(self, db: Session):
        """Load initial state from database or seed defaults."""
        from database import Base, engine
        Base.metadata.create_all(bind=engine)

        settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
        if not settings:
            settings = SystemSettings(
                id=1,
                temperature_normal_max=60.0,
                temperature_warning_max=65.0,
                temperature_critical_max=70.0,
                humidity_normal_max=60.0,
                humidity_warning_max=75.0,
                humidity_critical_max=85.0,
                moisture_target=20.0,
                monitoring_interval=5,
                heater_state="ON",
                fan_state="ON",
                airflow_mode="AUTO",
                monitoring_enabled=True,
                door_state="CLOSED"
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)

        # Check for active or demo batch
        batch = db.query(Batch).filter(Batch.status == "RUNNING").first()
        if not batch:
            batch = db.query(Batch).filter(Batch.batch_id == "B001").first()
            if not batch:
                batch = Batch(
                    batch_id="B001",
                    product_name="Apple Slices",
                    initial_weight=12.5,
                    initial_moisture=82.0,
                    target_moisture=20.0,
                    temperature_setpoint=55.0,
                    start_time=datetime.datetime.utcnow() - datetime.timedelta(hours=2, minutes=15),
                    status="RUNNING"
                )
                db.add(batch)
                db.commit()
                db.refresh(batch)
        
        self.active_batch_id = batch.batch_id if batch else None

        # Check last reading
        last = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).first()
        if last:
            self.temperature = last.temperature
            self.humidity = last.humidity
            self.moisture = last.moisture
            self.last_reading = last.to_dict()
        else:
            # Seed 20 historical readings so graphs and analytics look rich from the start
            self.seed_history(db, batch.batch_id if batch else "B001")

    def seed_history(self, db: Session, batch_id: str):
        now = datetime.datetime.utcnow()
        t_temp = 42.0
        t_hum = 68.0
        t_moist = 80.0
        readings = []

        for i in range(25, 0, -1):
            ts = now - datetime.timedelta(minutes=i * 5)
            # gradual progression
            t_temp = min(55.2, t_temp + random.uniform(0.3, 0.7))
            t_hum = max(42.0, t_hum - random.uniform(0.6, 1.2))
            t_moist = max(31.0, t_moist - random.uniform(1.2, 2.0))
            
            # add small realistic noise
            disp_temp = round(t_temp + random.uniform(-0.3, 0.3), 1)
            disp_hum = round(t_hum + random.uniform(-0.5, 0.5), 1)
            disp_moist = round(t_moist + random.uniform(-0.3, 0.3), 1)

            reading = SensorReading(
                timestamp=ts,
                batch_id=batch_id,
                temperature=disp_temp,
                humidity=disp_hum,
                moisture=disp_moist,
                data_source="SIMULATION"
            )
            readings.append(reading)

        db.add_all(readings)
        db.commit()

        self.temperature = 55.2
        self.humidity = 42.0
        self.moisture = 31.0
        latest = readings[-1]
        self.last_reading = latest.to_dict()

    def step(self, db: Session):
        """Execute one simulation cycle with simulated safety interlock support."""
        settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
        if not settings or not settings.monitoring_enabled:
            return None

        # Check current active batch
        active_batch = db.query(Batch).filter(Batch.status == "RUNNING").first()
        batch_id = active_batch.batch_id if active_batch else None
        self.active_batch_id = batch_id

        # -------------------------------------------------------------
        # SIMULATED SAFETY INTERLOCK ENFORCEMENT
        # If door is open, dryer cannot operate: heater and fan forced OFF,
        # active batch stopped, and safety alert maintained.
        # Notice: Simulated interlock only. Real hardware requires hardware-level interlock.
        # -------------------------------------------------------------
        is_door_open = (settings.door_state == "OPEN")
        if is_door_open:
            if settings.heater_state != "OFF" or settings.fan_state != "OFF":
                settings.heater_state = "OFF"
                settings.fan_state = "OFF"
                db.commit()

            # Immediately stop active batch
            if active_batch and active_batch.status == "RUNNING":
                active_batch.status = "STOPPED"
                if not active_batch.end_time:
                    active_batch.end_time = datetime.datetime.utcnow()
                db.commit()
                active_batch = None
                self.active_batch_id = None

            # Maintain active Safety Interlock alert
            door_alert = db.query(Alert).filter(
                Alert.parameter == "Door Interlock",
                Alert.status == "ACTIVE"
            ).first()
            if not door_alert:
                door_alert = Alert(
                    timestamp=datetime.datetime.utcnow(),
                    batch_id=batch_id,
                    parameter="Door Interlock",
                    value=1.0,
                    threshold=0.0,
                    severity="CRITICAL",
                    status="ACTIVE",
                    message="SAFETY ALERT: Door is open. Dryer stopped."
                )
                db.add(door_alert)
                db.commit()
        else:
            # Door is CLOSED: resolve any existing door interlock alert
            active_door_alerts = db.query(Alert).filter(
                Alert.parameter == "Door Interlock",
                Alert.status == "ACTIVE"
            ).all()
            if active_door_alerts:
                for a in active_door_alerts:
                    a.status = "RESOLVED"
                db.commit()

        setpoint = active_batch.temperature_setpoint if active_batch else 55.0

        # THERMODYNAMIC SIMULATION
        # 1. Temperature
        if is_door_open:
            # Door open: Rapid cooling towards ambient temperature
            if self.temperature > self.ambient_temp + 1.0:
                self.temperature -= random.uniform(0.7, 1.5)
            else:
                self.temperature = self.ambient_temp + random.uniform(-0.2, 0.2)
        elif settings.heater_state == "ON":
            if self.temperature < setpoint:
                # Heating up
                self.temperature += random.uniform(0.3, 0.8)
            elif self.temperature > setpoint + 0.8:
                # Modulating
                self.temperature -= random.uniform(0.2, 0.4)
            else:
                # Steady state fluctuation around setpoint
                self.temperature += random.uniform(-0.25, 0.25)
        else:
            # Heater OFF: cools towards ambient
            if self.temperature > self.ambient_temp + 1.0:
                self.temperature -= random.uniform(0.4, 0.9)
            else:
                self.temperature = self.ambient_temp + random.uniform(-0.3, 0.3)

        # 2. Airflow & Fan (Interlock prevents fan when door is open)
        is_fan_on = (settings.fan_state == "ON" and not is_door_open)
        if settings.airflow_mode == "AUTO" and not is_door_open:
            # Auto turns on fan if temp > 35 only when door is closed
            if self.temperature > 35.0 and not is_fan_on:
                settings.fan_state = "ON"
                is_fan_on = True
                db.commit()

        # 3. Chamber Humidity
        if is_door_open:
            # Door open: chamber air equilibrates with ambient humidity
            if self.humidity < self.ambient_humidity - 2.0:
                self.humidity += random.uniform(0.6, 1.4)
            elif self.humidity > self.ambient_humidity + 2.0:
                self.humidity -= random.uniform(0.6, 1.4)
            else:
                self.humidity += random.uniform(-0.3, 0.3)
        elif is_fan_on:
            # Active ventilation exhausts water vapor
            target_hum = max(28.0, 65.0 - (self.temperature - 25.0) * 0.7)
            if self.humidity > target_hum:
                self.humidity -= random.uniform(0.3, 0.8)
            else:
                self.humidity += random.uniform(-0.4, 0.4)
        else:
            # Fan OFF: vapor builds up
            if self.humidity < 80.0:
                self.humidity += random.uniform(0.5, 1.2)
            else:
                self.humidity += random.uniform(-0.3, 0.3)

        # 4. Food Moisture Dynamics (Only progresses if batch is RUNNING and door is CLOSED)
        if active_batch and active_batch.status == "RUNNING" and not is_door_open:
            target_moist = active_batch.target_moisture
            if self.moisture > target_moist:
                # Drying rate depends on temperature and fan
                drying_factor = 0.05
                if self.temperature >= 50.0:
                    drying_factor += 0.15
                elif self.temperature >= 40.0:
                    drying_factor += 0.08

                if is_fan_on:
                    drying_factor += 0.10

                self.moisture = max(target_moist, self.moisture - random.uniform(0.08, 0.22) * drying_factor)
                
                # Check for batch completion
                if self.moisture <= target_moist + 0.1:
                    self.moisture = target_moist
                    active_batch.status = "COMPLETED"
                    active_batch.end_time = datetime.datetime.utcnow()
                    db.commit()
                    # Create batch completion alert
                    comp_alert = Alert(
                        timestamp=datetime.datetime.utcnow(),
                        batch_id=active_batch.batch_id,
                        parameter="Batch",
                        value=self.moisture,
                        threshold=target_moist,
                        severity="INFO",
                        status="ACTIVE",
                        message=f"Drying cycle for batch {active_batch.batch_id} ({active_batch.product_name}) completed successfully."
                    )
                    db.add(comp_alert)
                    db.commit()

        # Bounds check
        self.temperature = max(15.0, min(95.0, self.temperature))
        self.humidity = max(10.0, min(99.0, self.humidity))
        self.moisture = max(5.0, min(95.0, self.moisture))

        # Save sensor reading
        reading = SensorReading(
            timestamp=datetime.datetime.utcnow(),
            batch_id=batch_id,
            temperature=round(self.temperature, 2),
            humidity=round(self.humidity, 2),
            moisture=round(self.moisture, 2),
            data_source="SIMULATION"
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)

        self.last_reading = reading.to_dict()

        # Automatic Alert Check
        self.evaluate_alerts(db, reading, settings)

        return self.last_reading

    def evaluate_alerts(self, db: Session, reading: SensorReading, settings: SystemSettings):
        """Check values against thresholds and generate alerts."""
        now = datetime.datetime.utcnow()

        # Temperature Alert
        if reading.temperature > settings.temperature_critical_max:
            self._create_or_update_alert(
                db, reading.batch_id, "Temperature", reading.temperature,
                settings.temperature_critical_max, "CRITICAL",
                f"High Temperature Alert: {reading.temperature:.1f}°C exceeds critical limit of {settings.temperature_critical_max:.1f}°C!"
            )
        elif reading.temperature > settings.temperature_warning_max:
            self._create_or_update_alert(
                db, reading.batch_id, "Temperature", reading.temperature,
                settings.temperature_warning_max, "WARNING",
                f"High Temperature Warning: {reading.temperature:.1f}°C exceeded warning threshold ({settings.temperature_warning_max:.1f}°C)."
            )

        # Humidity Alert
        if reading.humidity > settings.humidity_critical_max:
            self._create_or_update_alert(
                db, reading.batch_id, "Humidity", reading.humidity,
                settings.humidity_critical_max, "CRITICAL",
                f"Critical Humidity Alert: Chamber humidity {reading.humidity:.1f}% exceeds maximum limit ({settings.humidity_critical_max:.1f}%)."
            )
        elif reading.humidity > settings.humidity_warning_max:
            self._create_or_update_alert(
                db, reading.batch_id, "Humidity", reading.humidity,
                settings.humidity_warning_max, "WARNING",
                f"High Humidity Warning: Chamber humidity {reading.humidity:.1f}% exceeded limit ({settings.humidity_warning_max:.1f}%)."
            )

    def _create_or_update_alert(self, db: Session, batch_id: str, parameter: str, value: float, threshold: float, severity: str, message: str):
        # Prevent spamming alerts within 2 minutes for same parameter and severity
        two_mins_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=2)
        existing = db.query(Alert).filter(
            Alert.parameter == parameter,
            Alert.severity == severity,
            Alert.status == "ACTIVE",
            Alert.timestamp >= two_mins_ago
        ).first()

        if not existing:
            alert = Alert(
                timestamp=datetime.datetime.utcnow(),
                batch_id=batch_id,
                parameter=parameter,
                value=round(value, 2),
                threshold=round(threshold, 2),
                severity=severity,
                status="ACTIVE",
                message=message
            )
            db.add(alert)
            db.commit()

# Global simulator instance
simulator = DehydrationSimulator()
