# Food Dehydration Digital Twin Monitoring System
### B.Tech Biotechnology Mini-Project Prototype
**Title**: "Digital Twin Monitoring System for Commercial Food Dehydration Facilities"

---

## 🌟 System Overview

This application is a functional, end-to-end prototype of a **Digital Twin Monitoring System** tailored for commercial food dehydration facilities. It simulates the thermodynamic and mass-transfer physics of food drying, persisting telemetric data into an SQLite database via a FastAPI backend, and delivering real-time digital twin visualization, analytics, alert management, and batch tracking through a React + TypeScript frontend.

```
+-------------------------------------------------------------+
|                     Simulation Engine                       |
|          (Thermodynamic & Fickian Moisture Kinetics)        |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|              SQLite Database & SQLAlchemy ORM               |
|   (sensor_readings, batches, alerts, system_settings)       |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                    FastAPI Backend API                      |
|       (Dashboard, Sensors, Batches, Alerts, Reports)        |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                   React + Vite Dashboard                    |
|        (Digital Twin, Sensor Cards, Analytics, Alerts)      |
+-------------------------------------------------------------+
```

> **Academic Prototype Notice**:
> The system operates in **Demo Simulation Mode**. There is no physical hardware currently connected. Physical integration with an **Arduino Uno R4 WiFi** is architected as future scope.

---

## 🚀 Quick Start Guide

### 1. Backend Server (FastAPI + SQLite)
Navigate to the `backend/` directory and run:
```powershell
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`

### 2. Frontend Application (React + Vite + Tailwind CSS)
In a separate terminal, navigate to the `frontend/` directory and run:
```powershell
cd frontend
npm run dev
```
- Web Application URL: `http://127.0.0.1:5173`

---

## 📱 Implemented Screens & Routes

1. **Login + Two-Factor Authentication (2FA)**:
   - Centered login card matching industrial reference
   - 6-digit OTP verification interface (`123456`)
   - Pre-filled prototype credentials for rapid demonstration (`admin@dryertwin.com` / `admin123`)
2. **Work Flow**:
   - 7-step standard operating procedure (Prepare Food, Arrange on Trays, Set Parameters, Start Dryer, Monitor, Check End Point, Remove & Store)
   - Academic and mass transfer process summary panels
3. **Dashboard (Main Operations)**:
   - Current Batch Card: Batch ID (`B001`), Product (`Apple Slices`), Start Time, Status (`RUNNING`), Progress (`72%`)
   - 4 Live Sensor Cards: Temperature (`55.2 °C`), Humidity (`42 %`), Moisture (`31 %`), Drying Progress (`72 %`)
   - Real-time **Digital Twin Dryer Visualization**: Multi-tier mesh trays, dehydrating food slices, radiant ceramic heating coils, rotating blower fan, exhaust vent, sensor probe badges
   - Dynamic Condition Status (Normal, Warning, Critical, Completed)
   - Live telemetric trend area chart and active alerts feed
4. **Live Sensor Control**:
   - Sensor readouts (Temperature, Humidity, Moisture, Chamber Door)
   - Actuator Control Panel (Heater ON/OFF, Fan ON/OFF, Airflow AUTO/MANUAL, Monitoring START/STOP)
   - Threshold Configuration (Temperature, Humidity, Moisture target) with SQLite persistence
5. **Analytics**:
   - Aggregate KPIs: Average Temperature, Average Humidity, Net Moisture Reduction, Specific Energy Consumption
   - Recharts Visualizations: Temperature Profile, Relative Humidity Curve, Fickian Moisture Kinetics, Batch-to-Batch Performance Bar Chart
6. **Alerts**:
   - Automated Alert Engine with threshold evaluation rules
   - Real-time active alerts table with parameter, value, threshold, and severity badges
   - Acknowledge and Resolve workflow buttons
7. **History**:
   - Chronological table of all batches and drying cycles
   - Search, Date, Product, and Status filtering
   - Interactive modal dossier showing timeseries curves for each selected batch
8. **Batch Management**:
   - `+ New Batch` modal with parameter inputs (Weight, Initial Moisture, Target Moisture, Temperature Setpoint)
   - Strict batch lifecycle state machine: `CREATED`, `RUNNING`, `PAUSED`, `STOPPED`, `COMPLETED`
9. **Reports**:
   - Quality Summary, Process Summary, and Batch Summary metrics
   - One-click `Download CSV` report generator and printable format
10. **Settings**:
    - System configuration, Digital Twin visual toggles, polling intervals, and threshold limits

---

## 🔌 Future Arduino Uno R4 WiFi Integration

When real hardware is ready, connect the Arduino to the same local network and send sensor measurements via HTTP POST to:

```http
POST /api/sensor/data
Content-Type: application/json

{
  "batch_id": "B001",
  "temperature": 55.4,
  "humidity": 41.8,
  "moisture": 32.1,
  "data_source": "ARDUINO_UNO_R4_WIFI"
}
```

The FastAPI backend automatically logs the reading into SQLite, evaluates warning thresholds, and synchronizes the React Digital Twin dashboard immediately.
