import os
import sys
import io
import csv
import datetime
import math
import random
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
import streamlit.components.v1 as components

# -------------------------------------------------------------
# 1. SETUP ENVIRONMENT & DATABASE CONTEXT
# -------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from database import engine, Base, SessionLocal
import models
from simulation import simulator
from digital_twin_3d import get_digital_twin_html

# Page configuration
st.set_page_config(
    page_title="Food Dehydration Digital Twin",
    page_icon="🍏",
    layout="wide",
    initial_sidebar_state="expanded"
)

# -------------------------------------------------------------
# 2. CUSTOM CSS STYLING
# -------------------------------------------------------------
st.markdown("""
<style>
  /* Global Fonts and Layout */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  html, body, [class*="css"] {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  /* Metric cards custom styling */
  .metric-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
  }
  .metric-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #cbd5e1;
  }
  .metric-title {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .metric-val {
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
    font-feature-settings: "tnum";
    font-variant-numeric: tabular-nums;
  }
  .metric-unit {
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
    margin-left: 2px;
  }
  .metric-delta {
    font-size: 12px;
    font-weight: 600;
    margin-top: 6px;
  }

  /* Status Badges */
  .badge-normal {
    background: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .badge-warning {
    background: #fffbeb;
    color: #92400e;
    border: 1px solid #fde68a;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .badge-critical {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .badge-completed {
    background: #eff6ff;
    color: #1e40af;
    border: 1px solid #bfdbfe;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  /* SOP Step Card */
  .sop-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 18px;
    margin-bottom: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }
  .sop-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }
  .sop-num {
    background: #0284c7;
    color: #ffffff;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
  }
  .sop-title {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
  }

  /* Safety alert box */
  .safety-box-alert {
    background: #fef2f2;
    border: 1px solid #ef4444;
    border-left: 5px solid #dc2626;
    border-radius: 8px;
    padding: 12px 16px;
    color: #991b1b;
    font-weight: 600;
    margin-bottom: 16px;
  }
  .safety-box-ready {
    background: #f0fdf4;
    border: 1px solid #22c55e;
    border-left: 5px solid #16a34a;
    border-radius: 8px;
    padding: 12px 16px;
    color: #166534;
    font-weight: 600;
    margin-bottom: 16px;
  }
</style>
""", unsafe_allow_html=True)

# -------------------------------------------------------------
# 3. DATABASE ACCESS HELPERS & SIMULATION STEP
# -------------------------------------------------------------
def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        simulator.initialize_state(db)
    finally:
        db.close()

init_db()

def get_system_state():
    db = SessionLocal()
    try:
        settings = db.query(models.SystemSettings).filter(models.SystemSettings.id == 1).first()
        if not settings:
            simulator.initialize_state(db)
            settings = db.query(models.SystemSettings).filter(models.SystemSettings.id == 1).first()

        latest_reading = db.query(models.SensorReading).order_by(models.SensorReading.timestamp.desc()).first()
        if not latest_reading:
            simulator.step(db)
            latest_reading = db.query(models.SensorReading).order_by(models.SensorReading.timestamp.desc()).first()

        active_batch = db.query(models.Batch).filter(models.Batch.status == "RUNNING").first()
        if not active_batch:
            active_batch = db.query(models.Batch).order_by(models.Batch.id.desc()).first()

        recent_readings = db.query(models.SensorReading).order_by(models.SensorReading.timestamp.desc()).limit(30).all()
        recent_readings = [r.to_dict() for r in reversed(recent_readings)]

        active_alerts = db.query(models.Alert).filter(models.Alert.status == "ACTIVE").order_by(models.Alert.timestamp.desc()).all()
        active_alert_count = len(active_alerts)

        # Compute drying progress
        progress = 0.0
        elapsed_minutes = 0.0
        if active_batch and latest_reading:
            init_m = active_batch.initial_moisture
            target_m = active_batch.target_moisture
            curr_m = latest_reading.moisture
            if init_m > target_m:
                progress = max(0.0, min(100.0, round(((init_m - curr_m) / (init_m - target_m)) * 100.0, 1)))
            if active_batch.start_time:
                elapsed_minutes = max(0.0, round((datetime.datetime.utcnow() - active_batch.start_time).total_seconds() / 60.0, 1))

        # Overall twin condition
        twin_status = "NORMAL"
        is_door_open = bool(settings and settings.door_state == "OPEN")
        if is_door_open:
            twin_status = "CRITICAL"
        elif active_batch and active_batch.status == "COMPLETED":
            twin_status = "COMPLETED"
        elif latest_reading and latest_reading.temperature > (settings.temperature_critical_max if settings else 70.0) or \
             latest_reading and latest_reading.humidity > (settings.humidity_critical_max if settings else 85.0):
            twin_status = "CRITICAL"
        elif latest_reading and latest_reading.temperature > (settings.temperature_warning_max if settings else 60.0) or \
             latest_reading and latest_reading.humidity > (settings.humidity_warning_max if settings else 75.0):
            twin_status = "WARNING"

        twin_state = {
            "heater": settings.heater_state if settings else "ON",
            "fan": settings.fan_state if settings else "ON",
            "airflow_mode": settings.airflow_mode if settings else "AUTO",
            "door": settings.door_state if settings else "CLOSED",
            "status": twin_status,
            "safety_interlock": "TRIPPED" if is_door_open else "ENGAGED",
            "monitoring_enabled": settings.monitoring_enabled if settings else True
        }

        batch_info = {
            "batch_id": active_batch.batch_id if active_batch else "N/A",
            "product_name": active_batch.product_name if active_batch else "None",
            "status": active_batch.status if active_batch else "NO_BATCH",
            "initial_weight": active_batch.initial_weight if active_batch else 0.0,
            "initial_moisture": active_batch.initial_moisture if active_batch else 0.0,
            "target_moisture": active_batch.target_moisture if active_batch else 0.0,
            "temperature_setpoint": active_batch.temperature_setpoint if active_batch else 55.0,
            "progress": progress,
            "elapsed_minutes": elapsed_minutes
        } if active_batch else None

        return {
            "sensor": latest_reading.to_dict() if latest_reading else {},
            "twin_state": twin_state,
            "batch_info": batch_info,
            "settings": settings.to_dict() if settings else {},
            "recent_readings": recent_readings,
            "active_alerts": [a.to_dict() for a in active_alerts],
            "active_alert_count": active_alert_count
        }
    finally:
        db.close()

def trigger_simulation_step():
    db = SessionLocal()
    try:
        simulator.step(db)
    finally:
        db.close()

def toggle_door_interlock():
    db = SessionLocal()
    try:
        settings = db.query(models.SystemSettings).filter(models.SystemSettings.id == 1).first()
        if not settings:
            return
        if settings.door_state == "CLOSED":
            # OPEN DOOR -> TRIP SAFETY INTERLOCK
            settings.door_state = "OPEN"
            settings.heater_state = "OFF"
            settings.fan_state = "OFF"
            # Stop running batch
            running = db.query(models.Batch).filter(models.Batch.status == "RUNNING").all()
            for b in running:
                b.status = "STOPPED"
                if not b.end_time:
                    b.end_time = datetime.datetime.utcnow()
            # Alert
            existing = db.query(models.Alert).filter(models.Alert.parameter == "Door Interlock", models.Alert.status == "ACTIVE").first()
            if not existing:
                alert = models.Alert(
                    timestamp=datetime.datetime.utcnow(),
                    batch_id=running[0].batch_id if running else None,
                    parameter="Door Interlock",
                    value=1.0,
                    threshold=0.0,
                    severity="CRITICAL",
                    status="ACTIVE",
                    message="SAFETY ALERT: Chamber door opened. Dryer heaters & blowers shut down."
                )
                db.add(alert)
        else:
            # CLOSE DOOR -> RESOLVE INTERLOCK
            settings.door_state = "CLOSED"
            alerts = db.query(models.Alert).filter(models.Alert.parameter == "Door Interlock", models.Alert.status == "ACTIVE").all()
            for a in alerts:
                a.status = "RESOLVED"
        db.commit()
    finally:
        db.close()

# -------------------------------------------------------------
# 4. SESSION STATE (AUTHENTICATION & APP CONTROLS)
# -------------------------------------------------------------
if "authenticated" not in st.session_state:
    st.session_state.authenticated = True  # Pre-authenticated for frictionless testing, toggleable

if "current_user" not in st.session_state:
    st.session_state.current_user = {
        "name": "Biotech Admin",
        "email": "admin@dryertwin.com",
        "role": "Lead Process Engineer"
    }

if "otp_step" not in st.session_state:
    st.session_state.otp_step = False

# -------------------------------------------------------------
# 5. AUTHENTICATION VIEW (IF SIGNED OUT)
# -------------------------------------------------------------
if not st.session_state.authenticated:
    st.markdown("<div style='height:40px;'></div>", unsafe_allow_html=True)
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown("""
        <div style="background:white; border:1px solid #e2e8f0; border-radius:16px; padding:32px; box-shadow:0 10px 25px -5px rgba(0,0,0,0.08); text-align:center;">
          <div style="display:inline-flex; align-items:center; justify-content:center; width:52px; height:52px; background:#e0f2fe; border-radius:12px; margin-bottom:12px;">
            <span style="font-size:26px;">🍏</span>
          </div>
          <h2 style="margin:0 0 4px 0; color:#0f172a; font-weight:700;">Digital Twin Portal</h2>
          <p style="margin:0 0 24px 0; color:#64748b; font-size:13px;">Commercial Food Dehydration Monitoring Facility</p>
        </div>
        """, unsafe_allow_html=True)

        if not st.session_state.otp_step:
            with st.form("login_form"):
                st.text_input("Operator Email", value="admin@dryertwin.com", key="login_email")
                st.text_input("Password", value="admin123", type="password", key="login_password")
                submit_login = st.form_submit_button("Continue to 2FA Verification", use_container_width=True)
                if submit_login:
                    if st.session_state.login_email == "admin@dryertwin.com" and st.session_state.login_password == "admin123":
                        st.session_state.otp_step = True
                        st.rerun()
                    else:
                        st.error("Invalid credentials. Demo: admin@dryertwin.com / admin123")
        else:
            with st.form("otp_form"):
                st.info("Enter the 6-digit 2FA verification token sent to authorized mobile authenticator (Demo: **123456**)")
                otp_code = st.text_input("6-Digit OTP Code", value="123456", max_chars=6)
                verify_btn = st.form_submit_button("Verify & Access Facility", use_container_width=True)
                if verify_btn:
                    if otp_code == "123456":
                        st.session_state.authenticated = True
                        st.session_state.otp_step = False
                        st.success("Authentication successful!")
                        st.rerun()
                    else:
                        st.error("Invalid 2FA code. Please enter 123456.")

        st.markdown("<div style='height:12px;'></div>", unsafe_allow_html=True)
        if st.button("⚡ 1-Click Instant Demo Login (Skip Form)", use_container_width=True):
            st.session_state.authenticated = True
            st.rerun()

    st.stop()

# -------------------------------------------------------------
# 6. FETCH CURRENT STATE & AUTO ADVANCE
# -------------------------------------------------------------
data = get_system_state()
sensor = data["sensor"]
twin = data["twin_state"]
batch = data["batch_info"]
recent = data["recent_readings"]
active_alerts = data["active_alerts"]
active_alert_count = data["active_alert_count"]
settings = data["settings"]

# -------------------------------------------------------------
# 7. SIDEBAR NAVIGATION & QUICK CONTROLS
# -------------------------------------------------------------
with st.sidebar:
    st.markdown("""
    <div style="display:flex; align-items:center; gap:10px; padding-bottom:12px; border-bottom:1px solid #e2e8f0; margin-bottom:14px;">
      <span style="font-size:26px;">🍏</span>
      <div>
        <div style="font-size:14px; font-weight:700; color:#0f172a;">Food Dehydration</div>
        <div style="font-size:11px; color:#64748b; font-weight:500;">Digital Twin Prototype</div>
      </div>
    </div>
    """, unsafe_allow_html=True)

    # Active User Pill
    user = st.session_state.current_user
    st.markdown(f"""
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; margin-bottom:16px;">
      <div style="font-size:12px; font-weight:700; color:#1e293b;">👤 {user['name']}</div>
      <div style="font-size:11px; color:#64748b;">{user['role']}</div>
    </div>
    """, unsafe_allow_html=True)

    # Navigation Menu
    alert_badge_text = f" ({active_alert_count})" if active_alert_count > 0 else ""
    page = st.radio(
        "NAVIGATION",
        [
            "📊 Dashboard",
            "🔄 Work Flow",
            "🎛️ Live Sensor Control",
            "📈 Analytics",
            f"⚠️ Alerts{alert_badge_text}",
            "📜 History",
            "📦 Batch Management",
            "📑 Reports",
            "⚙️ Settings"
        ],
        index=0,
        label_visibility="collapsed"
    )

    st.markdown("---")
    st.markdown("<div style='font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;'>Chamber Telemetry Controls</div>", unsafe_allow_html=True)

    # Interlock status in sidebar
    is_door_open = (twin["door"] == "OPEN")
    if is_door_open:
        st.markdown("<div style='color:#ef4444; font-size:12px; font-weight:700; margin-bottom:6px;'>🚨 Door: OPEN (TRIPPED)</div>", unsafe_allow_html=True)
        if st.button("🔒 Close Door (Reset Interlock)", use_container_width=True):
            toggle_door_interlock()
            st.rerun()
    else:
        st.markdown("<div style='color:#10b981; font-size:12px; font-weight:700; margin-bottom:6px;'>✅ Door: CLOSED (READY)</div>", unsafe_allow_html=True)
        if st.button("🔓 Open Door (Trip Interlock)", use_container_width=True):
            toggle_door_interlock()
            st.rerun()

    # Step simulation button
    st.markdown("<div style='height:8px;'></div>", unsafe_allow_html=True)
    if st.button("⏩ Advance Simulation (+1 Step)", use_container_width=True):
        trigger_simulation_step()
        st.rerun()

    st.markdown("---")
    if st.button("Sign Out", use_container_width=True):
        st.session_state.authenticated = False
        st.rerun()

# -------------------------------------------------------------
# 8. PAGE 1: 📊 DASHBOARD
# -------------------------------------------------------------
if page == "📊 Dashboard":
    # Top Status Banner
    st_c1, st_c2 = st.columns([3, 1])
    with st_c1:
        st.markdown("<h2 style='margin:0; font-weight:700; color:#0f172a;'>Chamber Dashboard</h2>", unsafe_allow_html=True)
        st.markdown("<p style='margin:0 0 16px 0; font-size:13px; color:#64748b;'>Real-time physical chamber twin synchronized with sensor telemetry & physics simulation</p>", unsafe_allow_html=True)
    with st_c2:
        condition_badge_html = {
            "NORMAL": "<span class='badge-normal'>● NORMAL CONDITION</span>",
            "WARNING": "<span class='badge-warning'>▲ WARNING THRESHOLD</span>",
            "CRITICAL": "<span class='badge-critical'>✖ CRITICAL LIMIT EXCEEDED</span>",
            "COMPLETED": "<span class='badge-completed'>✔ DRYING COMPLETED</span>"
        }.get(twin["status"], "<span class='badge-normal'>● NORMAL</span>")
        st.markdown(f"<div style='text-align:right; margin-top:6px;'>{condition_badge_html}</div>", unsafe_allow_html=True)

    # Safety Notice if door open
    if twin["door"] == "OPEN":
        st.markdown("""
        <div class="safety-box-alert">
          🚨 SAFETY INTERLOCK TRIPPED: Chamber door is currently OPEN. Heating elements and blower fans are automatically deactivated.
        </div>
        """, unsafe_allow_html=True)

    # 4 Metric Cards
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.markdown(f"""
        <div class="metric-card">
          <div class="metric-title">🌡️ Chamber Temp</div>
          <div class="metric-val">{sensor.get('temperature', 55.2):.1f}<span class="metric-unit">°C</span></div>
          <div class="metric-delta" style="color:#0284c7;">Setpoint: {batch['temperature_setpoint'] if batch else 55.0:.1f}°C</div>
        </div>
        """, unsafe_allow_html=True)
    with m2:
        st.markdown(f"""
        <div class="metric-card">
          <div class="metric-title">💧 Chamber Humidity</div>
          <div class="metric-val">{sensor.get('humidity', 42.0):.1f}<span class="metric-unit">%</span></div>
          <div class="metric-delta" style="color:#64748b;">Target limit: &lt; 60%</div>
        </div>
        """, unsafe_allow_html=True)
    with m3:
        st.markdown(f"""
        <div class="metric-card">
          <div class="metric-title">🍏 Sample Moisture</div>
          <div class="metric-val">{sensor.get('moisture', 31.0):.1f}<span class="metric-unit">%</span></div>
          <div class="metric-delta" style="color:#10b981;">Target: {batch['target_moisture'] if batch else 20.0:.1f}%</div>
        </div>
        """, unsafe_allow_html=True)
    with m4:
        st.markdown(f"""
        <div class="metric-card">
          <div class="metric-title">⏳ Drying Progress</div>
          <div class="metric-val">{batch['progress'] if batch else 72.0:.1f}<span class="metric-unit">%</span></div>
          <div class="metric-delta" style="color:#6366f1;">Status: {batch['status'] if batch else 'IDLE'}</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<div style='height:16px;'></div>", unsafe_allow_html=True)

    # 3D Digital Twin Viewport (Full interactive Three.js Canvas)
    st.markdown("""
    <div style="background:#090d16; border:1px solid #1e293b; border-radius:12px; padding:12px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,0.2);">
      <div style="color:#94a3b8; font-size:12px; font-weight:600; display:flex; justify-content:space-between; margin-bottom:8px; padding:0 6px;">
        <span>🎮 INTERACTIVE 3D DIGITAL TWIN (CLICK & DRAG TO ORBIT • SCROLL TO ZOOM)</span>
        <span>DRYING CHAMBER: DT-CHAMBER-01</span>
      </div>
    </div>
    """, unsafe_allow_html=True)
    
    twin_html = get_digital_twin_html(sensor, twin, batch)
    components.html(twin_html, height=450, scrolling=False)

    # Actuator Status Bar
    st.markdown(f"""
    <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:12px 18px; margin-bottom:24px; display:flex; flex-wrap:wrap; justify-content:space-between; font-size:12px;">
      <div><span style="color:#64748b;">Heater Output:</span> <b style="color:{'#ef4444' if twin['heater']=='ON' else '#64748b'};">{twin['heater']} (PID Active)</b></div>
      <div><span style="color:#64748b;">Circulation Fan:</span> <b style="color:{'#0284c7' if twin['fan']=='ON' else '#64748b'};">{twin['fan']} ({twin['airflow_mode']})</b></div>
      <div><span style="color:#64748b;">Chamber Door:</span> <b style="color:{'#ef4444' if twin['door']=='OPEN' else '#10b981'};">{twin['door']} (Interlock {'TRIPPED' if twin['door']=='OPEN' else 'READY'})</b></div>
      <div><span style="color:#64748b;">Active Product:</span> <b>{batch['product_name'] if batch else 'No Batch'} ({batch['batch_id'] if batch else ''})</b></div>
    </div>
    """, unsafe_allow_html=True)

    # Live Telemetric Trend Plotly Chart
    c_chart, c_batch = st.columns([2, 1])
    with c_chart:
        st.markdown("<h4 style='font-size:15px; font-weight:700; margin-bottom:10px; color:#0f172a;'>Live Telemetric Trends (Real-Time Sensors)</h4>", unsafe_allow_html=True)
        if recent:
            df_recent = pd.DataFrame(recent)
            df_recent['time'] = pd.to_datetime(df_recent['timestamp']).dt.strftime('%H:%M:%S')

            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=df_recent['time'], y=df_recent['temperature'],
                name="Temperature (°C)", mode='lines+markers',
                line=dict(color='#ef4444', width=2.5)
            ))
            fig.add_trace(go.Scatter(
                x=df_recent['time'], y=df_recent['humidity'],
                name="Humidity (%)", mode='lines+markers',
                line=dict(color='#0284c7', width=2.5)
            ))
            fig.add_trace(go.Scatter(
                x=df_recent['time'], y=df_recent['moisture'],
                name="Moisture (%)", mode='lines+markers',
                line=dict(color='#10b981', width=2.5)
            ))
            fig.update_layout(
                height=320,
                margin=dict(l=20, r=20, t=20, b=20),
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                paper_bgcolor="#ffffff",
                plot_bgcolor="#f8fafc",
                xaxis=dict(showgrid=True, gridcolor="#e2e8f0"),
                yaxis=dict(showgrid=True, gridcolor="#e2e8f0")
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No sensor telemetry logged yet.")

    with c_batch:
        st.markdown("<h4 style='font-size:15px; font-weight:700; margin-bottom:10px; color:#0f172a;'>Current Batch Dossier</h4>", unsafe_allow_html=True)
        if batch:
            st.markdown(f"""
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; font-size:12px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="font-weight:700; font-size:14px; color:#0284c7;">Batch {batch['batch_id']}</span>
                <span style="font-weight:700; background:#f1f5f9; padding:2px 8px; border-radius:4px;">{batch['status']}</span>
              </div>
              <div style="margin-bottom:6px;"><span style="color:#64748b;">Product:</span> <b>{batch['product_name']}</b></div>
              <div style="margin-bottom:6px;"><span style="color:#64748b;">Initial Weight:</span> <b>{batch['initial_weight']:.1f} kg</b></div>
              <div style="margin-bottom:6px;"><span style="color:#64748b;">Moisture Target:</span> <b>{batch['initial_moisture']:.1f}% ➔ {batch['target_moisture']:.1f}%</b></div>
              <div style="margin-bottom:6px;"><span style="color:#64748b;">Set Temperature:</span> <b>{batch['temperature_setpoint']:.1f} °C</b></div>
              <div style="margin-bottom:12px;"><span style="color:#64748b;">Elapsed Time:</span> <b>{batch['elapsed_minutes']:.1f} mins</b></div>
              <div style="margin-bottom:4px; font-weight:600; color:#334155;">Drying Progress: {batch['progress']:.1f}%</div>
            </div>
            """, unsafe_allow_html=True)
            st.progress(batch['progress'] / 100.0)
        else:
            st.warning("No batch currently active.")

# -------------------------------------------------------------
# 9. PAGE 2: 🔄 WORK FLOW
# -------------------------------------------------------------
elif page == "🔄 Work Flow":
    st.markdown("<h2 style='font-weight:700; color:#0f172a; margin-bottom:4px;'>Standard Operating Procedure (SOP)</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color:#64748b; font-size:13px; margin-bottom:24px;'>Commercial Food Dehydration Operational Workflow & Biotechnology Kinetics</p>", unsafe_allow_html=True)

    sop_steps = [
        ("Prepare Food", "Thoroughly wash and sanitize raw agricultural produce. Slice fruits or vegetables uniformly to a consistent thickness of 5 mm to ensure homogeneous mass transfer and prevent localized case hardening.", "Preparation & Uniform Slicing", "5 mm Slice Thickness"),
        ("Arrange on Trays", "Distribute slices in a single layer across perforated 316 stainless-steel mesh drying trays. Maintain a minimum 10 mm boundary gap between slices to facilitate unrestricted turbulent airflow.", "Tray Loading Geometry", "10 mm Spacing Gap"),
        ("Set Parameters", "Configure thermal setpoint (55.0°C) and target final moisture threshold (20.0%) based on the equilibrium moisture content (EMC) isotherms for the specific food matrix.", "Kinetics Parameterization", "T_set: 55°C, Target: 20%"),
        ("Start Dryer", "Verify chamber door safety interlock is engaged. Activate radiant ceramic heating elements and circulation blower to establish forced-convective boundary layers.", "Thermal & Flow Actuation", "Door Interlock Checked"),
        ("Monitor Moisture Kinetics", "Track Fickian diffusion rate, water activity (Aw), and relative humidity reduction curves in real time using the digital twin telemetry engine.", "Thermodynamic Observation", "Falling Rate Kinetics"),
        ("Check End Point", "Equilibrate sample when the moisture trajectory asymptotically approaches target threshold. Validate water activity Aw < 0.60 to inhibit microbial proliferation.", "Equilibrium Verification", "Aw < 0.60 Target"),
        ("Remove & Store", "De-energize heating coils. Allow trays to cool to ambient temperature (25°C) before packaging in moisture-barrier vacuum pouches to prevent rehydration.", "Quality Assurance & Storage", "Moisture-Barrier Seal")
    ]

    col_l, col_r = st.columns([3, 2])
    with col_l:
        for idx, (title, desc, tag1, tag2) in enumerate(sop_steps, start=1):
            st.markdown(f"""
            <div class="sop-card">
              <div class="sop-header">
                <div class="sop-num">{idx}</div>
                <div class="sop-title">{title}</div>
              </div>
              <p style="font-size:13px; color:#475569; line-height:1.5; margin:0 0 10px 0;">{desc}</p>
              <div style="display:flex; gap:8px;">
                <span style="background:#f1f5f9; color:#475569; font-size:11px; padding:2px 8px; border-radius:4px; font-weight:600;">{tag1}</span>
                <span style="background:#e0f2fe; color:#0369a1; font-size:11px; padding:2px 8px; border-radius:4px; font-weight:600;">{tag2}</span>
              </div>
            </div>
            """, unsafe_allow_html=True)

    with col_r:
        st.markdown("""
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
          <h4 style="margin:0 0 12px 0; color:#0f172a; font-weight:700;">Biotechnology & Mass Transfer Reference</h4>
          <p style="font-size:12px; color:#475569; line-height:1.6;">
            Dehydration operates primarily in the <b>Falling Rate Period</b>, governed by Fick's Second Law of Diffusion:
          </p>
          <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:12px; font-family:monospace; font-size:13px; margin:12px 0; text-align:center; color:#0f172a;">
            ∂M/∂t = D_eff · ∇²M
          </div>
          <p style="font-size:12px; color:#475569; line-height:1.6;">
            Dimensionless <b>Moisture Ratio (MR)</b> is calculated dynamically as:
          </p>
          <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:12px; font-family:monospace; font-size:13px; margin:12px 0; text-align:center; color:#0f172a;">
            MR = (M_t - M_e) / (M_0 - M_e) = exp(-k · t)
          </div>
          <ul style="font-size:12px; color:#64748b; padding-left:18px; line-height:1.6;">
            <li><b>M_t</b>: Transient moisture content (% dry basis)</li>
            <li><b>M_0</b>: Initial green tissue moisture (80-85%)</li>
            <li><b>M_e</b>: Equilibrium moisture content (~15-20%)</li>
            <li><b>D_eff</b>: Effective moisture diffusivity (~10⁻⁹ to 10⁻¹⁰ m²/s)</li>
          </ul>
        </div>
        """, unsafe_allow_html=True)

# -------------------------------------------------------------
# 10. PAGE 3: 🎛️ LIVE SENSOR CONTROL & ACTUATORS
# -------------------------------------------------------------
elif page == "🎛️ Live Sensor Control":
    st.markdown("<h2 style='font-weight:700; color:#0f172a; margin-bottom:4px;'>Chamber Actuators & Sensor Overrides</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color:#64748b; font-size:13px; margin-bottom:24px;'>Direct hardware supervisory control, actuator state overrides, and interlock management</p>", unsafe_allow_html=True)

    c_act, c_params = st.columns([3, 2])

    with c_act:
        st.markdown("<h4 style='font-size:15px; font-weight:700; margin-bottom:12px;'>Actuator Control Panel</h4>", unsafe_allow_html=True)

        # Door Safety Interlock Control
        st.markdown("""
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:700; font-size:14px; color:#0f172a;">Chamber Door Safety Interlock</div>
              <div style="font-size:12px; color:#64748b;">Physical door sensor (simulated safety switch)</div>
            </div>
          </div>
        </div>
        """, unsafe_allow_html=True)

        is_door_open = (twin["door"] == "OPEN")
        btn_label = "Close Chamber Door (Reset Interlock)" if is_door_open else "Open Chamber Door (Trip Safety Interlock)"
        if st.button(btn_label, type="primary" if is_door_open else "secondary", use_container_width=True):
            toggle_door_interlock()
            st.rerun()

        st.markdown("<div style='height:12px;'></div>", unsafe_allow_html=True)

        # Heater and Fan Controls
        db = SessionLocal()
        try:
            curr_settings = db.query(models.SystemSettings).filter(models.SystemSettings.id == 1).first()

            col_h, col_f = st.columns(2)
            with col_h:
                st.markdown(f"**Ceramic Heater:** `{curr_settings.heater_state}`")
                if is_door_open:
                    st.caption("🔒 Locked OFF by Door Interlock")
                else:
                    if st.button("Toggle Heater ON/OFF", use_container_width=True):
                        curr_settings.heater_state = "OFF" if curr_settings.heater_state == "ON" else "ON"
                        db.commit()
                        st.rerun()

            with col_f:
                st.markdown(f"**Blower Fan:** `{curr_settings.fan_state}`")
                if is_door_open:
                    st.caption("🔒 Locked OFF by Door Interlock")
                else:
                    if st.button("Toggle Fan ON/OFF", use_container_width=True):
                        curr_settings.fan_state = "OFF" if curr_settings.fan_state == "ON" else "ON"
                        db.commit()
                        st.rerun()

            st.markdown("<div style='height:12px;'></div>", unsafe_allow_html=True)

            col_air, col_mon = st.columns(2)
            with col_air:
                st.markdown(f"**Airflow Mode:** `{curr_settings.airflow_mode}`")
                if st.button("Switch Airflow (AUTO/MANUAL)", use_container_width=True):
                    curr_settings.airflow_mode = "MANUAL" if curr_settings.airflow_mode == "AUTO" else "AUTO"
                    db.commit()
                    st.rerun()

            with col_mon:
                st.markdown(f"**Simulation Engine:** `{'RUNNING' if curr_settings.monitoring_enabled else 'PAUSED'}`")
                if st.button("Toggle Simulation Running", use_container_width=True):
                    curr_settings.monitoring_enabled = not curr_settings.monitoring_enabled
                    db.commit()
                    st.rerun()
        finally:
            db.close()

    with c_params:
        st.markdown("<h4 style='font-size:15px; font-weight:700; margin-bottom:12px;'>Live Sensor Probe Readouts</h4>", unsafe_allow_html=True)
        st.markdown(f"""
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">
          <div style="margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #f1f5f9;">
            <div style="color:#64748b; font-size:11px;">PROBE T1 (THERMOCOUPLE)</div>
            <div style="font-size:22px; font-weight:700; color:#ef4444;">{sensor.get('temperature', 55.2):.2f} °C</div>
          </div>
          <div style="margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #f1f5f9;">
            <div style="color:#64748b; font-size:11px;">PROBE H1 (PSYCHROMETRIC RH)</div>
            <div style="font-size:22px; font-weight:700; color:#0284c7;">{sensor.get('humidity', 42.0):.2f} %</div>
          </div>
          <div>
            <div style="color:#64748b; font-size:11px;">PROBE M1 (MOISTURE IMPEDANCE)</div>
            <div style="font-size:22px; font-weight:700; color:#10b981;">{sensor.get('moisture', 31.0):.2f} %</div>
          </div>
        </div>
        """, unsafe_allow_html=True)

# -------------------------------------------------------------
# 11. PAGE 4: 📈 ANALYTICS
# -------------------------------------------------------------
elif page == "📈 Analytics":
    st.markdown("<h2 style='font-weight:700; color:#0f172a; margin-bottom:4px;'>Process Analytics & Thermodynamic Kinetics</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color:#64748b; font-size:13px; margin-bottom:24px;'>Empirical drying curves, psychrometric trends, and batch energy metrics</p>", unsafe_allow_html=True)

    db = SessionLocal()
    try:
        all_readings = db.query(models.SensorReading).order_by(models.SensorReading.timestamp.desc()).limit(150).all()
        all_batches = db.query(models.Batch).all()
    finally:
        db.close()

    if all_readings:
        df_all = pd.DataFrame([r.to_dict() for r in reversed(all_readings)])
        df_all['time'] = pd.to_datetime(df_all['timestamp']).dt.strftime('%H:%M:%S')

        # KPI Metrics
        avg_temp = df_all['temperature'].mean()
        avg_hum = df_all['humidity'].mean()
        net_moisture_red = df_all['moisture'].iloc[0] - df_all['moisture'].iloc[-1]
        energy_est = len(df_all) * 0.08  # ~0.08 kWh per 5-min step

        k1, k2, k3, k4 = st.columns(4)
        with k1:
            st.metric("Avg Chamber Temp", f"{avg_temp:.1f} °C")
        with k2:
            st.metric("Avg Relative Humidity", f"{avg_hum:.1f} %")
        with k3:
            st.metric("Net Moisture Loss", f"{max(0.0, net_moisture_red):.1f} %")
        with k4:
            st.metric("Estimated Energy Used", f"{energy_est:.2f} kWh")

        st.markdown("<div style='height:16px;'></div>", unsafe_allow_html=True)

        g1, g2 = st.columns(2)
        with g1:
            st.markdown("##### 🌡️ Chamber Temperature Profile")
            fig_t = px.line(df_all, x="time", y="temperature", color_discrete_sequence=["#ef4444"])
            fig_t.update_layout(height=280, margin=dict(l=20, r=20, t=10, b=20), plot_bgcolor="#f8fafc")
            st.plotly_chart(fig_t, use_container_width=True)

        with g2:
            st.markdown("##### 💧 Relative Humidity Curve")
            fig_h = px.line(df_all, x="time", y="humidity", color_discrete_sequence=["#0284c7"])
            fig_h.update_layout(height=280, margin=dict(l=20, r=20, t=10, b=20), plot_bgcolor="#f8fafc")
            st.plotly_chart(fig_h, use_container_width=True)

        g3, g4 = st.columns(2)
        with g3:
            st.markdown("##### 🍏 Fickian Moisture Kinetics (Falling Rate Period)")
            # Compute MR = (M - 15) / (80 - 15)
            df_all['MR'] = (df_all['moisture'] - 15.0).clip(lower=0.0) / (80.0 - 15.0)
            fig_m = px.area(df_all, x="time", y="MR", color_discrete_sequence=["#10b981"])
            fig_m.update_layout(height=280, margin=dict(l=20, r=20, t=10, b=20), plot_bgcolor="#f8fafc")
            st.plotly_chart(fig_m, use_container_width=True)

        with g4:
            st.markdown("##### 📊 Batch-to-Batch Performance Comparison")
            if all_batches:
                df_b = pd.DataFrame([b.to_dict() for b in all_batches])
                df_b['moisture_removed'] = df_b['initial_moisture'] - df_b['target_moisture']
                fig_b = px.bar(df_b, x="batch_id", y="moisture_removed", color="product_name", barmode="group")
                fig_b.update_layout(height=280, margin=dict(l=20, r=20, t=10, b=20), plot_bgcolor="#f8fafc")
                st.plotly_chart(fig_b, use_container_width=True)
            else:
                st.info("No batch history recorded.")
    else:
        st.info("No analytics data available.")

# -------------------------------------------------------------
# 12. PAGE 5: ⚠️ ALERTS
# -------------------------------------------------------------
elif page.startswith("⚠️ Alerts"):
    st.markdown("<h2 style='font-weight:700; color:#0f172a; margin-bottom:4px;'>Chamber Alerts & Safety Notifications</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color:#64748b; font-size:13px; margin-bottom:24px;'>Threshold violation monitoring, safety interlock trips, and resolution log</p>", unsafe_allow_html=True)

    db = SessionLocal()
    try:
        all_alerts = db.query(models.Alert).order_by(models.Alert.timestamp.desc()).limit(100).all()
    finally:
        db.close()

    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.metric("Total Logged Alerts", len(all_alerts))
    with c2:
        st.metric("Active Alerts", len([a for a in all_alerts if a.status == "ACTIVE"]))
    with c3:
        st.metric("Critical Limit Trips", len([a for a in all_alerts if a.severity == "CRITICAL"]))
    with c4:
        st.metric("Warning Deviations", len([a for a in all_alerts if a.severity == "WARNING"]))

    st.markdown("<div style='height:12px;'></div>", unsafe_allow_html=True)

    # Resolve all button
    if st.button("Resolve All Active Alerts"):
        db = SessionLocal()
        try:
            active = db.query(models.Alert).filter(models.Alert.status.in_(["ACTIVE", "ACKNOWLEDGED"])).all()
            for a in active:
                a.status = "RESOLVED"
            db.commit()
            st.success(f"Resolved {len(active)} alerts.")
            st.rerun()
        finally:
            db.close()

    st.markdown("<div style='height:12px;'></div>", unsafe_allow_html=True)

    # Alerts list with individual Acknowledge / Resolve buttons
    for alert in all_alerts:
        sev_color = "#ef4444" if alert.severity == "CRITICAL" else ("#f59e0b" if alert.severity == "WARNING" else "#0284c7")
        st.markdown(f"""
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-left:4px solid {sev_color}; border-radius:8px; padding:12px 16px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span style="font-weight:700; color:{sev_color}; font-size:11px; text-transform:uppercase;">[{alert.severity}]</span>
              <b style="color:#0f172a; margin-left:6px; font-size:13px;">{alert.message}</b>
              <div style="font-size:11px; color:#64748b; margin-top:4px;">
                Parameter: <b>{alert.parameter}</b> • Value: <b>{alert.value:.1f}</b> • Threshold: <b>{alert.threshold:.1f}</b> • Timestamp: {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S')}
              </div>
            </div>
            <div>
              <span style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:4px; background:{'#fef2f2' if alert.status=='ACTIVE' else '#f1f5f9'}; color:{'#dc2626' if alert.status=='ACTIVE' else '#64748b'};">
                {alert.status}
              </span>
            </div>
          </div>
        </div>
        """, unsafe_allow_html=True)

# -------------------------------------------------------------
# 13. PAGE 6: 📜 HISTORY
# -------------------------------------------------------------
elif page == "📜 History":
    st.markdown("<h2 style='font-weight:700; color:#0f172a; margin-bottom:4px;'>Batch Production History</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color:#64748b; font-size:13px; margin-bottom:24px;'>Chronological drying records, batch dossiers, and historical sensor telemetry</p>", unsafe_allow_html=True)

    db = SessionLocal()
    try:
        batches = db.query(models.Batch).order_by(models.Batch.id.desc()).all()
    finally:
        db.close()

    if batches:
        batch_dicts = [b.to_dict() for b in batches]
        df_b = pd.DataFrame(batch_dicts)
        st.dataframe(df_b, use_container_width=True)

        st.markdown("<div style='height:16px;'></div>", unsafe_allow_html=True)
        st.markdown("#### 🔍 Batch Dossier Inspector")
        selected_b_id = st.selectbox("Select Batch to Inspect:", [b.batch_id for b in batches])

        db = SessionLocal()
        try:
            target_b = db.query(models.Batch).filter(models.Batch.batch_id == selected_b_id).first()
            b_readings = db.query(models.SensorReading).filter(models.SensorReading.batch_id == selected_b_id).order_by(models.SensorReading.timestamp.asc()).all()
        finally:
            db.close()

        if target_b:
            st.markdown(f"""
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:14px; font-size:13px;">
              <b>Batch ID:</b> {target_b.batch_id} | <b>Product:</b> {target_b.product_name} | <b>Status:</b> {target_b.status} | <b>Initial Weight:</b> {target_b.initial_weight} kg
            </div>
            """, unsafe_allow_html=True)

        if b_readings:
            df_br = pd.DataFrame([r.to_dict() for r in b_readings])
            df_br['time'] = pd.to_datetime(df_br['timestamp']).dt.strftime('%H:%M:%S')
            fig_hist = px.line(df_br, x="time", y=["temperature", "humidity", "moisture"], title=f"Historical Drying Profile for {selected_b_id}")
            fig_hist.update_layout(plot_bgcolor="#f8fafc")
            st.plotly_chart(fig_hist, use_container_width=True)
        else:
            st.info(f"No specific sensor readings tied to batch {selected_b_id}.")

# -------------------------------------------------------------
# 14. PAGE 7: 📦 BATCH MANAGEMENT
# -------------------------------------------------------------
elif page == "📦 Batch Management":
    st.markdown("<h2 style='font-weight:700; color:#0f172a; margin-bottom:4px;'>Batch Management & State Machine</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color:#64748b; font-size:13px; margin-bottom:24px;'>Register food batches, configure target moisture, and control process state machine</p>", unsafe_allow_html=True)

    col_create, col_ctrl = st.columns([1, 1])

    with col_create:
        st.markdown("#### ➕ Register New Batch")
        with st.form("create_batch_form"):
            b_id = st.text_input("Batch ID", value=f"B{random.randint(100, 999)}")
            b_prod = st.selectbox("Product Name", ["Apple Slices", "Mango Slices", "Banana Chips", "Tomato Halves", "Herbs & Basil"])
            b_weight = st.number_input("Initial Weight (kg)", value=12.5, min_value=1.0, max_value=50.0)
            b_init_m = st.number_input("Initial Moisture (%)", value=82.0, min_value=30.0, max_value=95.0)
            b_targ_m = st.number_input("Target Moisture (%)", value=20.0, min_value=5.0, max_value=40.0)
            b_t_set = st.number_input("Temperature Setpoint (°C)", value=55.0, min_value=35.0, max_value=85.0)
            submit_batch = st.form_submit_button("Register & Create Batch", use_container_width=True)

            if submit_batch:
                db = SessionLocal()
                try:
                    existing = db.query(models.Batch).filter(models.Batch.batch_id == b_id).first()
                    if existing:
                        st.error(f"Batch {b_id} already exists.")
                    else:
                        nb = models.Batch(
                            batch_id=b_id,
                            product_name=b_prod,
                            initial_weight=b_weight,
                            initial_moisture=b_init_m,
                            target_moisture=b_targ_m,
                            temperature_setpoint=b_t_set,
                            status="CREATED",
                            created_at=datetime.datetime.utcnow()
                        )
                        db.add(nb)
                        db.commit()
                        st.success(f"Batch {b_id} successfully registered!")
                        st.rerun()
                finally:
                    db.close()

    with col_ctrl:
        st.markdown("#### ⏯️ Active Batch State Machine")
        db = SessionLocal()
        try:
            curr_b = db.query(models.Batch).order_by(models.Batch.id.desc()).first()
            if curr_b:
                st.markdown(f"""
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:16px;">
                  <div style="font-weight:700; font-size:16px; color:#0284c7;">{curr_b.batch_id} — {curr_b.product_name}</div>
                  <div style="font-size:13px; color:#64748b; margin-top:4px;">Current Status: <b>{curr_b.status}</b></div>
                </div>
                """, unsafe_allow_html=True)

                c_start, c_pause, c_stop, c_comp = st.columns(4)
                with c_start:
                    if st.button("Start / Run", use_container_width=True):
                        # Interlock check
                        settings = db.query(models.SystemSettings).filter(models.SystemSettings.id == 1).first()
                        if settings and settings.door_state == "OPEN":
                            st.error("Cannot start dryer. Please close chamber door first.")
                        else:
                            curr_b.status = "RUNNING"
                            if not curr_b.start_time:
                                curr_b.start_time = datetime.datetime.utcnow()
                            if settings:
                                settings.heater_state = "ON"
                                settings.fan_state = "ON"
                            db.commit()
                            st.rerun()
                with c_pause:
                    if st.button("Pause", use_container_width=True):
                        curr_b.status = "PAUSED"
                        db.commit()
                        st.rerun()
                with c_stop:
                    if st.button("Stop", use_container_width=True):
                        curr_b.status = "STOPPED"
                        curr_b.end_time = datetime.datetime.utcnow()
                        db.commit()
                        st.rerun()
                with c_comp:
                    if st.button("Complete", use_container_width=True):
                        curr_b.status = "COMPLETED"
                        curr_b.end_time = datetime.datetime.utcnow()
                        db.commit()
                        st.rerun()
            else:
                st.info("No batch records created yet.")
        finally:
            db.close()

# -------------------------------------------------------------
# 15. PAGE 8: 📑 REPORTS
# -------------------------------------------------------------
elif page == "📑 Reports":
    st.markdown("<h2 style='font-weight:700; color:#0f172a; margin-bottom:4px;'>Quality & Process Summary Reports</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color:#64748b; font-size:13px; margin-bottom:24px;'>Official commercial batch certificate generation and telemetric CSV download</p>", unsafe_allow_html=True)

    db = SessionLocal()
    try:
        batches = db.query(models.Batch).order_by(models.Batch.id.desc()).all()
        readings = db.query(models.SensorReading).order_by(models.SensorReading.timestamp.desc()).limit(300).all()
    finally:
        db.close()

    # Generate CSV in-memory
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["FOOD DEHYDRATION DIGITAL TWIN MONITORING SYSTEM - TELEMETRY REPORT"])
    writer.writerow(["Generated At (UTC)", datetime.datetime.utcnow().isoformat()])
    writer.writerow([])
    writer.writerow(["BATCH SUMMARY"])
    writer.writerow(["Batch ID", "Product", "Status", "Initial Weight (kg)", "Initial Moisture (%)", "Target Moisture (%)", "Setpoint (°C)"])
    for b in batches:
        writer.writerow([b.batch_id, b.product_name, b.status, b.initial_weight, b.initial_moisture, b.target_moisture, b.temperature_setpoint])
    writer.writerow([])
    writer.writerow(["TIMESTAMPED SENSOR READINGS"])
    writer.writerow(["ID", "Timestamp (UTC)", "Batch ID", "Temperature (°C)", "Humidity (%)", "Moisture (%)", "Data Source"])
    for r in readings:
        writer.writerow([r.id, r.timestamp.isoformat(), r.batch_id or "N/A", r.temperature, r.humidity, r.moisture, r.data_source])

    csv_data = output.getvalue().encode('utf-8')

    st.download_button(
        label="📥 Download Complete CSV Telemetry Report",
        data=csv_data,
        file_name=f"dryer_twin_report_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv",
        mime="text/csv",
        use_container_width=True
    )

    st.markdown("<div style='height:16px;'></div>", unsafe_allow_html=True)
    st.markdown("#### Preview of Batches Included in Report:")
    if batches:
        st.dataframe(pd.DataFrame([b.to_dict() for b in batches]), use_container_width=True)

# -------------------------------------------------------------
# 16. PAGE 9: ⚙️ SETTINGS
# -------------------------------------------------------------
elif page == "⚙️ Settings":
    st.markdown("<h2 style='font-weight:700; color:#0f172a; margin-bottom:4px;'>System Configuration & Thresholds</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color:#64748b; font-size:13px; margin-bottom:24px;'>Set physical alert thresholds, simulation polling intervals, and preferences</p>", unsafe_allow_html=True)

    db = SessionLocal()
    try:
        sys_settings = db.query(models.SystemSettings).filter(models.SystemSettings.id == 1).first()

        with st.form("settings_form"):
            st.markdown("##### 🌡️ Temperature Alarm Limits (°C)")
            c_t1, c_t2, c_t3 = st.columns(3)
            with c_t1:
                t_norm = st.number_input("Normal Max Temp (°C)", value=float(sys_settings.temperature_normal_max), step=1.0)
            with c_t2:
                t_warn = st.number_input("Warning Max Temp (°C)", value=float(sys_settings.temperature_warning_max), step=1.0)
            with c_t3:
                t_crit = st.number_input("Critical Max Temp (°C)", value=float(sys_settings.temperature_critical_max), step=1.0)

            st.markdown("##### 💧 Relative Humidity Alarm Limits (%)")
            c_h1, c_h2, c_h3 = st.columns(3)
            with c_h1:
                h_norm = st.number_input("Normal Max RH (%)", value=float(sys_settings.humidity_normal_max), step=1.0)
            with c_h2:
                h_warn = st.number_input("Warning Max RH (%)", value=float(sys_settings.humidity_warning_max), step=1.0)
            with c_h3:
                h_crit = st.number_input("Critical Max RH (%)", value=float(sys_settings.humidity_critical_max), step=1.0)

            st.markdown("##### ⚙️ Simulation & Polling Interval")
            p_interval = st.slider("Telemetry Sampling Interval (Seconds)", min_value=2, max_value=60, value=int(sys_settings.monitoring_interval))

            save_settings = st.form_submit_button("Save System Configuration", use_container_width=True)

            if save_settings:
                sys_settings.temperature_normal_max = t_norm
                sys_settings.temperature_warning_max = t_warn
                sys_settings.temperature_critical_max = t_crit
                sys_settings.humidity_normal_max = h_norm
                sys_settings.humidity_warning_max = h_warn
                sys_settings.humidity_critical_max = h_crit
                sys_settings.monitoring_interval = p_interval
                db.commit()
                st.success("Configuration persisted successfully to database!")
                st.rerun()
    finally:
        db.close()
