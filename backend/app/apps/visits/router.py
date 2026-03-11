from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.apps.users.models import User
from app.apps.beneficiaries.models import BeneficiaryProfile
from app.apps.visits.models import Visit, VisitStatus, VisitPriority
from app.apps.visits.schemas import (
    VisitCreate,
    VisitRead,
    VisitUpdate,
    VisitComplete,
    VisitWithDetails,
    VisitListResponse
)

router = APIRouter(prefix="/visits", tags=["Visits"])


@router.get("/", response_model=VisitListResponse)
async def list_visits(
    status: Optional[VisitStatus] = None,
    beneficiary_id: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List visits - ASHA workers see their own visits, partners/admins see all.
    Returns visits with summary counts.
    """
    query = select(Visit)
    
    # Role-based filtering
    if current_user.role == 'asha_worker':
        query = query.where(Visit.asha_worker_id == current_user.id)
    elif current_user.role == 'beneficiary':
        # Beneficiaries can see their own scheduled visits
        result = await db.execute(
            select(BeneficiaryProfile.id).where(BeneficiaryProfile.user_id == current_user.id)
        )
        beneficiary = result.scalar_one_or_none()
        if beneficiary:
            query = query.where(Visit.beneficiary_id == beneficiary)
        else:
            return VisitListResponse(visits=[], total=0, today_count=0, overdue_count=0)
    
    # Apply filters
    if status:
        query = query.where(Visit.status == status)
    if beneficiary_id:
        query = query.where(Visit.beneficiary_id == beneficiary_id)
    if from_date:
        query = query.where(Visit.scheduled_date >= from_date)
    if to_date:
        query = query.where(Visit.scheduled_date <= to_date)
    
    # Order by date
    query = query.order_by(Visit.scheduled_date.asc(), Visit.priority.desc())
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    # Count today's visits
    today = date.today()
    today_query = select(func.count()).select_from(Visit).where(
        and_(
            Visit.scheduled_date == today,
            Visit.asha_worker_id == current_user.id if current_user.role == 'asha_worker' else True
        )
    )
    today_count = await db.scalar(today_query) or 0
    
    # Count overdue visits
    overdue_query = select(func.count()).select_from(Visit).where(
        and_(
            Visit.scheduled_date < today,
            Visit.status == VisitStatus.SCHEDULED,
            Visit.asha_worker_id == current_user.id if current_user.role == 'asha_worker' else True
        )
    )
    overdue_count = await db.scalar(overdue_query) or 0
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    visits = result.scalars().all()
    
    # Enrich with details
    enriched_visits = []
    for visit in visits:
        # Get beneficiary details
        ben_result = await db.execute(
            select(BeneficiaryProfile).where(BeneficiaryProfile.id == visit.beneficiary_id)
        )
        beneficiary = ben_result.scalar_one_or_none()
        
        # Get ASHA worker name
        asha_result = await db.execute(
            select(User).where(User.id == visit.asha_worker_id)
        )
        asha = asha_result.scalar_one_or_none()
        
        enriched_visits.append(VisitWithDetails(
            id=visit.id,
            beneficiary_id=visit.beneficiary_id,
            asha_worker_id=visit.asha_worker_id,
            scheduled_date=visit.scheduled_date,
            scheduled_time=visit.scheduled_time,
            visit_type=visit.visit_type,
            purpose=visit.purpose,
            notes=visit.notes,
            status=visit.status,
            priority=visit.priority,
            completed_at=visit.completed_at,
            health_log_id=visit.health_log_id,
            created_at=visit.created_at,
            updated_at=visit.updated_at,
            beneficiary_name=beneficiary.name if beneficiary else None,
            beneficiary_user_type=beneficiary.user_type if beneficiary else None,
            beneficiary_risk_level=beneficiary.risk_level if beneficiary else None,
            beneficiary_address=beneficiary.address if beneficiary else None,
            asha_worker_name=asha.name if asha else None
        ))
    
    return VisitListResponse(
        visits=enriched_visits,
        total=total,
        today_count=today_count,
        overdue_count=overdue_count
    )


@router.get("/today", response_model=List[VisitWithDetails])
async def get_today_visits(
    current_user: User = Depends(require_roles('asha_worker')),
    db: AsyncSession = Depends(get_db)
):
    """Get today's scheduled visits for the ASHA worker"""
    today = date.today()
    
    query = select(Visit).where(
        and_(
            Visit.asha_worker_id == current_user.id,
            Visit.scheduled_date == today
        )
    ).order_by(Visit.priority.desc(), Visit.scheduled_time.asc())
    
    result = await db.execute(query)
    visits = result.scalars().all()
    
    enriched_visits = []
    for visit in visits:
        ben_result = await db.execute(
            select(BeneficiaryProfile).where(BeneficiaryProfile.id == visit.beneficiary_id)
        )
        beneficiary = ben_result.scalar_one_or_none()
        
        enriched_visits.append(VisitWithDetails(
            id=visit.id,
            beneficiary_id=visit.beneficiary_id,
            asha_worker_id=visit.asha_worker_id,
            scheduled_date=visit.scheduled_date,
            scheduled_time=visit.scheduled_time,
            visit_type=visit.visit_type,
            purpose=visit.purpose,
            notes=visit.notes,
            status=visit.status,
            priority=visit.priority,
            completed_at=visit.completed_at,
            health_log_id=visit.health_log_id,
            created_at=visit.created_at,
            updated_at=visit.updated_at,
            beneficiary_name=beneficiary.name if beneficiary else None,
            beneficiary_user_type=beneficiary.user_type if beneficiary else None,
            beneficiary_risk_level=beneficiary.risk_level if beneficiary else None,
            beneficiary_address=beneficiary.address if beneficiary else None,
            asha_worker_name=current_user.name
        ))
    
    return enriched_visits


@router.get("/overdue", response_model=List[VisitWithDetails])
async def get_overdue_visits(
    current_user: User = Depends(require_roles('asha_worker')),
    db: AsyncSession = Depends(get_db)
):
    """Get overdue visits (scheduled but not completed, date has passed)"""
    today = date.today()
    
    query = select(Visit).where(
        and_(
            Visit.asha_worker_id == current_user.id,
            Visit.scheduled_date < today,
            Visit.status == VisitStatus.SCHEDULED
        )
    ).order_by(Visit.scheduled_date.asc())
    
    result = await db.execute(query)
    visits = result.scalars().all()
    
    enriched_visits = []
    for visit in visits:
        ben_result = await db.execute(
            select(BeneficiaryProfile).where(BeneficiaryProfile.id == visit.beneficiary_id)
        )
        beneficiary = ben_result.scalar_one_or_none()
        
        enriched_visits.append(VisitWithDetails(
            id=visit.id,
            beneficiary_id=visit.beneficiary_id,
            asha_worker_id=visit.asha_worker_id,
            scheduled_date=visit.scheduled_date,
            scheduled_time=visit.scheduled_time,
            visit_type=visit.visit_type,
            purpose=visit.purpose,
            notes=visit.notes,
            status=visit.status,
            priority=visit.priority,
            completed_at=visit.completed_at,
            health_log_id=visit.health_log_id,
            created_at=visit.created_at,
            updated_at=visit.updated_at,
            beneficiary_name=beneficiary.name if beneficiary else None,
            beneficiary_user_type=beneficiary.user_type if beneficiary else None,
            beneficiary_risk_level=beneficiary.risk_level if beneficiary else None,
            beneficiary_address=beneficiary.address if beneficiary else None,
            asha_worker_name=current_user.name
        ))
    
    return enriched_visits


@router.post("/", response_model=VisitRead, status_code=status.HTTP_201_CREATED)
async def create_visit(
    visit_data: VisitCreate,
    current_user: User = Depends(require_roles('asha_worker', 'partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """
    Create/schedule a new visit.
    ASHA workers can schedule visits for any beneficiary.
    """
    # Verify beneficiary exists
    ben_result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == visit_data.beneficiary_id)
    )
    beneficiary = ben_result.scalar_one_or_none()
    if not beneficiary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beneficiary not found"
        )
    
    # Create the visit
    new_visit = Visit(
        beneficiary_id=visit_data.beneficiary_id,
        asha_worker_id=current_user.id,
        scheduled_date=visit_data.scheduled_date,
        scheduled_time=visit_data.scheduled_time,
        visit_type=visit_data.visit_type,
        purpose=visit_data.purpose,
        notes=visit_data.notes,
        priority=visit_data.priority,
        status=VisitStatus.SCHEDULED
    )
    
    db.add(new_visit)
    await db.commit()
    await db.refresh(new_visit)
    
    return new_visit


@router.get("/{visit_id}", response_model=VisitWithDetails)
async def get_visit(
    visit_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific visit by ID"""
    result = await db.execute(
        select(Visit).where(Visit.id == visit_id)
    )
    visit = result.scalar_one_or_none()
    
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit not found"
        )
    
    # Permission check
    if current_user.role == 'asha_worker' and visit.asha_worker_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get beneficiary details
    ben_result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == visit.beneficiary_id)
    )
    beneficiary = ben_result.scalar_one_or_none()
    
    # Get ASHA worker details
    asha_result = await db.execute(
        select(User).where(User.id == visit.asha_worker_id)
    )
    asha = asha_result.scalar_one_or_none()
    
    return VisitWithDetails(
        id=visit.id,
        beneficiary_id=visit.beneficiary_id,
        asha_worker_id=visit.asha_worker_id,
        scheduled_date=visit.scheduled_date,
        scheduled_time=visit.scheduled_time,
        visit_type=visit.visit_type,
        purpose=visit.purpose,
        notes=visit.notes,
        status=visit.status,
        priority=visit.priority,
        completed_at=visit.completed_at,
        health_log_id=visit.health_log_id,
        created_at=visit.created_at,
        updated_at=visit.updated_at,
        beneficiary_name=beneficiary.name if beneficiary else None,
        beneficiary_user_type=beneficiary.user_type if beneficiary else None,
        beneficiary_risk_level=beneficiary.risk_level if beneficiary else None,
        beneficiary_address=beneficiary.address if beneficiary else None,
        asha_worker_name=asha.name if asha else None
    )


@router.put("/{visit_id}", response_model=VisitRead)
async def update_visit(
    visit_id: str,
    update_data: VisitUpdate,
    current_user: User = Depends(require_roles('asha_worker', 'partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """Update a scheduled visit"""
    result = await db.execute(
        select(Visit).where(Visit.id == visit_id)
    )
    visit = result.scalar_one_or_none()
    
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit not found"
        )
    
    # Permission check for ASHA workers
    if current_user.role == 'asha_worker' and visit.asha_worker_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(visit, field, value)
    
    await db.commit()
    await db.refresh(visit)
    
    return visit


@router.post("/{visit_id}/complete", response_model=VisitRead)
async def complete_visit(
    visit_id: str,
    complete_data: VisitComplete,
    current_user: User = Depends(require_roles('asha_worker')),
    db: AsyncSession = Depends(get_db)
):
    """Mark a visit as completed"""
    result = await db.execute(
        select(Visit).where(Visit.id == visit_id)
    )
    visit = result.scalar_one_or_none()
    
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit not found"
        )
    
    if visit.asha_worker_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if visit.status != VisitStatus.SCHEDULED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot complete a visit with status: {visit.status}"
        )
    
    visit.status = VisitStatus.COMPLETED
    visit.completed_at = datetime.utcnow()
    if complete_data.health_log_id:
        visit.health_log_id = complete_data.health_log_id
    if complete_data.notes:
        visit.notes = complete_data.notes
    
    await db.commit()
    await db.refresh(visit)
    
    return visit


@router.post("/{visit_id}/cancel", response_model=VisitRead)
async def cancel_visit(
    visit_id: str,
    current_user: User = Depends(require_roles('asha_worker', 'partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a scheduled visit"""
    result = await db.execute(
        select(Visit).where(Visit.id == visit_id)
    )
    visit = result.scalar_one_or_none()
    
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit not found"
        )
    
    if current_user.role == 'asha_worker' and visit.asha_worker_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if visit.status != VisitStatus.SCHEDULED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel a visit with status: {visit.status}"
        )
    
    visit.status = VisitStatus.CANCELLED
    
    await db.commit()
    await db.refresh(visit)
    
    return visit


@router.delete("/{visit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_visit(
    visit_id: str,
    current_user: User = Depends(require_roles('partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """Delete a visit (admin/partner only)"""
    result = await db.execute(
        select(Visit).where(Visit.id == visit_id)
    )
    visit = result.scalar_one_or_none()
    
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit not found"
        )
    
    await db.delete(visit)
    await db.commit()
