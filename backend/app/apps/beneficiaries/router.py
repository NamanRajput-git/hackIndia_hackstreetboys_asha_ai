from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.apps.users.models import User
from app.apps.beneficiaries.models import BeneficiaryProfile
from app.apps.beneficiaries.schemas import (
    BeneficiaryCreate,
    BeneficiaryRead,
    BeneficiaryUpdate,
    BeneficiaryWithDetails
)

router = APIRouter(prefix="/beneficiaries", tags=["Beneficiaries"])


@router.get("/", response_model=List[BeneficiaryRead])
async def list_beneficiaries(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    risk_level: Optional[str] = None,
    user_type: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List beneficiaries - filtered by role permissions"""
    query = select(BeneficiaryProfile)
    
    # Role-based filtering
    if current_user.role == 'beneficiary':
        query = query.where(BeneficiaryProfile.user_id == current_user.id)
    elif current_user.role == 'asha_worker':
        # To ensure ASHA can see all potential patients (unlinked or linked), we show all beneficiaries.
                # ASHA workers see their linked beneficiaries
        query = query.where(
            or_(
                BeneficiaryProfile.linked_asha_id == current_user.id,
                BeneficiaryProfile.user_id == current_user.id
            )
        )
        # In a production app with multiple ASHAs, we would filter by location/catchment area here.
        # pass
    # Partners and admins see all
    
    # Apply filters
    if risk_level:
        query = query.where(BeneficiaryProfile.risk_level == risk_level)
    if user_type:
        query = query.where(BeneficiaryProfile.user_type == user_type)
    if search:
        query = query.where(BeneficiaryProfile.name.ilike(f"%{search}%"))
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/my-profile", response_model=BeneficiaryRead)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's beneficiary profile"""
    result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beneficiary profile not found"
        )
    
    return profile


@router.post("/", response_model=BeneficiaryRead, status_code=status.HTTP_201_CREATED)
async def create_beneficiary(
    beneficiary_data: BeneficiaryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a beneficiary profile for the current user"""
    # Check if profile already exists
    result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.user_id == current_user.id)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Beneficiary profile already exists"
        )
    
    new_profile = BeneficiaryProfile(
        user_id=current_user.id,
        **beneficiary_data.model_dump()
    )
    
    db.add(new_profile)
    await db.commit()
    await db.refresh(new_profile)
    
    return new_profile


@router.get("/{beneficiary_id}", response_model=BeneficiaryWithDetails)
async def get_beneficiary(
    beneficiary_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific beneficiary by ID"""
    result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == beneficiary_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beneficiary not found"
        )
    
    # Permission check
    if current_user.role == 'beneficiary' and profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get related counts
    from sqlalchemy import func
    from app.apps.children.models import Child
    from app.apps.health_logs.models import HealthLog
    from app.apps.alerts.models import Alert
    
    children_count = await db.scalar(
        select(func.count()).select_from(Child).where(Child.beneficiary_id == profile.id)
    )
    health_logs_count = await db.scalar(
        select(func.count()).select_from(HealthLog).where(HealthLog.beneficiary_id == profile.id)
    )
    alerts_count = await db.scalar(
        select(func.count()).select_from(Alert).where(Alert.beneficiary_id == profile.id)
    )
    
    return BeneficiaryWithDetails(
        **{c.name: getattr(profile, c.name) for c in profile.__table__.columns},
        children_count=children_count or 0,
        health_logs_count=health_logs_count or 0,
        alerts_count=alerts_count or 0
    )


@router.put("/{beneficiary_id}", response_model=BeneficiaryRead)
async def update_beneficiary(
    beneficiary_id: str,
    update_data: BeneficiaryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a beneficiary profile.
    - Beneficiaries can update their own profile
    - ASHA workers can update their linked beneficiaries' health data
    - Partners/Admins can update any profile
    """
    result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == beneficiary_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beneficiary not found"
        )
    
    # Permission check
    if current_user.role == 'beneficiary':
        if profile.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    elif current_user.role == 'asha_worker':
        # ASHA workers can only update their linked beneficiaries
        if profile.linked_asha_id != current_user.id and profile.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your linked beneficiaries"
            )
    # Partners and admins can update any profile
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    
    await db.commit()
    await db.refresh(profile)
    
    return profile


@router.delete("/{beneficiary_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_beneficiary(
    beneficiary_id: str,
    current_user: User = Depends(require_roles('partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """Delete a beneficiary (admin/partner only)"""
    result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == beneficiary_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beneficiary not found"
        )
    
    await db.delete(profile)
    await db.commit()


@router.post("/{beneficiary_id}/link-asha", response_model=BeneficiaryRead)
async def link_asha_to_beneficiary(
    beneficiary_id: str,
    current_user: User = Depends(require_roles('asha_worker', 'partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """
    Link current ASHA worker to a beneficiary.
    This allows the ASHA worker to manage this beneficiary.
    """
    result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == beneficiary_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beneficiary not found"
        )
    
    # Only ASHA workers link themselves, partners/admins can link anyone
    if current_user.role == 'asha_worker':
        profile.linked_asha_id = current_user.id
    else:
        # Partners/admins - for now we also link the current user
        # In future, this could accept an asha_id parameter
        profile.linked_asha_id = current_user.id
    
    await db.commit()
    await db.refresh(profile)
    
    return profile


@router.delete("/{beneficiary_id}/link-asha", response_model=BeneficiaryRead)
async def unlink_asha_from_beneficiary(
    beneficiary_id: str,
    current_user: User = Depends(require_roles('asha_worker', 'partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """
    Unlink ASHA worker from a beneficiary.
    """
    result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == beneficiary_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beneficiary not found"
        )
    
    # ASHA workers can only unlink themselves
    if current_user.role == 'asha_worker':
        if profile.linked_asha_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only unlink yourself from beneficiaries"
            )
    
    profile.linked_asha_id = None
    
    await db.commit()
    await db.refresh(profile)
    
    return profile
