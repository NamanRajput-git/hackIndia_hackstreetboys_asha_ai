from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.apps.users.models import User
from app.apps.beneficiaries.models import BeneficiaryProfile
from app.apps.health_logs.models import HealthLog
from app.apps.health_logs.schemas import (
    HealthLogCreate,
    HealthLogRead,
    HealthLogUpdate,
    HealthLogWithDetails
)

router = APIRouter(prefix="/health-logs", tags=["Health Logs"])


@router.get("/", response_model=List[HealthLogRead])
async def list_health_logs(
    beneficiary_id: Optional[str] = None,
    is_emergency: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List health logs with role-based filtering"""
    query = select(HealthLog)
    
    # Role-based filtering
    if current_user.role == 'beneficiary':
        # Get beneficiary's profile IDs
        profiles_result = await db.execute(
            select(BeneficiaryProfile.id).where(BeneficiaryProfile.user_id == current_user.id)
        )
        profile_ids = [p for p in profiles_result.scalars().all()]
        query = query.where(HealthLog.beneficiary_id.in_(profile_ids))
    
    # Apply filters
    if beneficiary_id:
        query = query.where(HealthLog.beneficiary_id == beneficiary_id)
    if is_emergency is not None:
        query = query.where(HealthLog.is_emergency == is_emergency)
    
    query = query.order_by(HealthLog.date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=HealthLogRead, status_code=status.HTTP_201_CREATED)
async def create_health_log(
    log_data: HealthLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a health log"""
    # Verify beneficiary exists and user has access
    result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == log_data.beneficiary_id)
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
    
    new_log = HealthLog(
        recorded_by=current_user.id,
        vitals={
            "bpSystolic": log_data.bp_systolic,
            "bpDiastolic": log_data.bp_diastolic
        },
        **log_data.model_dump(exclude={'vitals'})
    )
    
    db.add(new_log)
    await db.commit()
    await db.refresh(new_log)
    
    return new_log


@router.get("/{log_id}", response_model=HealthLogWithDetails)
async def get_health_log(
    log_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific health log"""
    result = await db.execute(
        select(HealthLog).where(HealthLog.id == log_id)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health log not found"
        )
    
    # Get beneficiary name
    ben_result = await db.execute(
        select(BeneficiaryProfile.name).where(BeneficiaryProfile.id == log.beneficiary_id)
    )
    beneficiary_name = ben_result.scalar_one_or_none()
    
    # Get recorder name
    recorder_name = None
    if log.recorded_by:
        rec_result = await db.execute(
            select(User.full_name).where(User.id == log.recorded_by)
        )
        recorder_name = rec_result.scalar_one_or_none()
    
    return HealthLogWithDetails(
        **{c.name: getattr(log, c.name) for c in log.__table__.columns},
        beneficiary_name=beneficiary_name,
        recorder_name=recorder_name
    )


@router.put("/{log_id}", response_model=HealthLogRead)
async def update_health_log(
    log_id: str,
    update_data: HealthLogUpdate,
    current_user: User = Depends(require_roles('asha_worker', 'partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """Update a health log (staff only)"""
    result = await db.execute(
        select(HealthLog).where(HealthLog.id == log_id)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health log not found"
        )
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(log, field, value)
    
    # Update vitals if BP changed
    if update_data.bp_systolic or update_data.bp_diastolic:
        log.vitals = {
            "bpSystolic": update_data.bp_systolic or log.bp_systolic,
            "bpDiastolic": update_data.bp_diastolic or log.bp_diastolic
        }
    
    await db.commit()
    await db.refresh(log)
    
    return log


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_health_log(
    log_id: str,
    current_user: User = Depends(require_roles('partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """Delete a health log (admin only)"""
    result = await db.execute(
        select(HealthLog).where(HealthLog.id == log_id)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health log not found"
        )
    
    await db.delete(log)
    await db.commit()
