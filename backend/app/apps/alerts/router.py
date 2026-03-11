from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.apps.users.models import User
from app.apps.beneficiaries.models import BeneficiaryProfile
from app.apps.alerts.models import Alert
from app.apps.alerts.schemas import (
    AlertCreate,
    AlertRead,
    AlertUpdate,
    AlertWithDetails
)

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/", response_model=List[AlertRead])
async def list_alerts(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List alerts with role-based filtering"""
    query = select(Alert)
    
    # Role-based filtering
    if current_user.role == 'beneficiary':
        # Get beneficiary's profile IDs
        profiles_result = await db.execute(
            select(BeneficiaryProfile.id).where(BeneficiaryProfile.user_id == current_user.id)
        )
        profile_ids = [p for p in profiles_result.scalars().all()]
        query = query.where(Alert.beneficiary_id.in_(profile_ids))
    
    # Apply filters
    if status_filter:
        query = query.where(Alert.status == status_filter)
    if severity:
        query = query.where(Alert.severity == severity)
    
    query = query.order_by(Alert.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/active", response_model=List[AlertWithDetails])
async def get_active_alerts(
    current_user: User = Depends(require_roles('asha_worker', 'partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """Get all active/open alerts for staff"""
    result = await db.execute(
        select(Alert).where(Alert.status == 'open').order_by(Alert.created_at.desc())
    )
    alerts = result.scalars().all()
    
    # Enrich with beneficiary names
    enriched = []
    for alert in alerts:
        ben_result = await db.execute(
            select(BeneficiaryProfile.name).where(BeneficiaryProfile.id == alert.beneficiary_id)
        )
        beneficiary_name = ben_result.scalar_one_or_none()
        
        enriched.append(AlertWithDetails(
            **{c.name: getattr(alert, c.name) for c in alert.__table__.columns},
            beneficiary_name=beneficiary_name
        ))
    
    return enriched


@router.post("/", response_model=AlertRead, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert_data: AlertCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create an alert (SOS or health risk)"""
    # Verify beneficiary exists
    result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == alert_data.beneficiary_id)
    )
    beneficiary = result.scalar_one_or_none()
    
    if not beneficiary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beneficiary not found"
        )
    
    # Permission check for beneficiaries
    if current_user.role == 'beneficiary' and beneficiary.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    new_alert = Alert(
        triggered_by=current_user.id,
        **alert_data.model_dump()
    )
    
    db.add(new_alert)
    await db.commit()
    await db.refresh(new_alert)
    
    return new_alert


@router.post("/sos/{beneficiary_id}", response_model=AlertRead, status_code=status.HTTP_201_CREATED)
async def trigger_sos(
    beneficiary_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Quick SOS trigger endpoint"""
    # Verify beneficiary exists
    result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == beneficiary_id)
    )
    beneficiary = result.scalar_one_or_none()
    
    if not beneficiary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beneficiary not found"
        )
    
    # Permission check
    if current_user.role == 'beneficiary' and beneficiary.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    new_alert = Alert(
        beneficiary_id=beneficiary_id,
        type='sos',
        severity='critical',
        status='open',
        reason='SOS Button Triggered',
        triggered_by=current_user.id
    )
    
    db.add(new_alert)
    await db.commit()
    await db.refresh(new_alert)
    
    return new_alert


@router.get("/{alert_id}", response_model=AlertWithDetails)
async def get_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific alert"""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id)
    )
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Get beneficiary name
    ben_result = await db.execute(
        select(BeneficiaryProfile.name).where(BeneficiaryProfile.id == alert.beneficiary_id)
    )
    beneficiary_name = ben_result.scalar_one_or_none()
    
    return AlertWithDetails(
        **{c.name: getattr(alert, c.name) for c in alert.__table__.columns},
        beneficiary_name=beneficiary_name
    )


@router.put("/{alert_id}", response_model=AlertRead)
async def update_alert(
    alert_id: str,
    update_data: AlertUpdate,
    current_user: User = Depends(require_roles('asha_worker', 'partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """Update/resolve an alert (staff only)"""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id)
    )
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(alert, field, value)
    
    # If resolving, set resolver and timestamp
    if update_data.status == 'resolved':
        alert.resolved_by = current_user.id
        alert.resolved_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(alert)
    
    return alert


@router.post("/{alert_id}/resolve", response_model=AlertRead)
async def resolve_alert(
    alert_id: str,
    resolution_notes: Optional[str] = None,
    current_user: User = Depends(require_roles('asha_worker', 'partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """Quick resolve endpoint"""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id)
    )
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    alert.status = 'resolved'
    alert.resolved_by = current_user.id
    alert.resolved_at = datetime.utcnow()
    if resolution_notes:
        alert.resolution_notes = resolution_notes
    
    await db.commit()
    await db.refresh(alert)
    
    return alert
