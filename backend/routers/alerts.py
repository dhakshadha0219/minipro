from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Alert

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("")
def list_alerts(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if status and status.upper() != "ALL":
        query = query.filter(Alert.status == status.upper())
    if severity and severity.upper() != "ALL":
        query = query.filter(Alert.severity == severity.upper())

    alerts = query.order_by(Alert.timestamp.desc()).limit(limit).all()
    return [a.to_dict() for a in alerts]

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "ACKNOWLEDGED"
    db.commit()
    db.refresh(alert)
    return alert.to_dict()

@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "RESOLVED"
    db.commit()
    db.refresh(alert)
    return alert.to_dict()

@router.post("/resolve-all")
def resolve_all_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).filter(Alert.status.in_(["ACTIVE", "ACKNOWLEDGED"])).all()
    for a in alerts:
        a.status = "RESOLVED"
    db.commit()
    return {"message": f"Resolved {len(alerts)} alerts"}
