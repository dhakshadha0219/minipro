import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
import models
from simulation import simulator

from routers import dashboard, sensors, batches, alerts, settings, reports, auth

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dryertwin")

# Background simulation runner
async def simulation_background_loop():
    logger.info("Starting background sensor simulation engine...")
    while True:
        try:
            db = SessionLocal()
            try:
                # Read configured interval
                sys_settings = db.query(models.SystemSettings).filter(models.SystemSettings.id == 1).first()
                interval = sys_settings.monitoring_interval if sys_settings else 5
                interval = max(2, min(60, interval))

                # Step simulation if enabled
                if sys_settings and sys_settings.monitoring_enabled:
                    simulator.step(db)
            finally:
                db.close()
            
            await asyncio.sleep(interval)
        except asyncio.CancelledError:
            logger.info("Simulation background task cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in simulation loop: {e}", exc_info=True)
            await asyncio.sleep(5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize Database Tables
    logger.info("Creating database tables if not exist...")
    Base.metadata.create_all(bind=engine)

    # 2. Seed default state & history
    db = SessionLocal()
    try:
        simulator.initialize_state(db)
    finally:
        db.close()

    # 3. Start background simulation loop
    sim_task = asyncio.create_task(simulation_background_loop())

    yield

    # Shutdown
    sim_task.cancel()
    try:
        await sim_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="Food Dehydration Digital Twin API",
    description="Backend API and Simulation Engine for Commercial Food Dehydration Facilities",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(dashboard.router)
app.include_router(sensors.router)
app.include_router(batches.router)
app.include_router(alerts.router)
app.include_router(settings.router)
app.include_router(reports.router)
app.include_router(auth.router)

@app.get("/")
def root():
    return {
        "system": "Digital Twin Monitoring System for Commercial Food Dehydration Facilities",
        "prototype_mode": "Demo Simulation",
        "hardware_integration": "Arduino Uno R4 WiFi (Future Scope)",
        "status": "Online",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "backend": "FastAPI",
        "database": "SQLite",
        "simulation_engine": "Active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
