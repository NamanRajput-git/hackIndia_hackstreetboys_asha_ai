from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.apps.users.models import User
from app.apps.beneficiaries.models import BeneficiaryProfile
from app.apps.schemes.models import Scheme
from app.apps.enrollments.models import Enrollment
from app.apps.enrollments.schemas import (
    EnrollmentCreate,
    EnrollmentRead,
    EnrollmentUpdate,
    EnrollmentWithDetails
)

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


@router.get("/", response_model=List[EnrollmentRead])
async def list_enrollments(
    scheme_id: Optional[str] = None,
    beneficiary_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List enrollments with role-based filtering"""
    query = select(Enrollment)
    
    # Role-based filtering
    if current_user.role == 'beneficiary':
        profiles_result = await db.execute(
            select(BeneficiaryProfile.id).where(BeneficiaryProfile.user_id == current_user.id)
        )
        profile_ids = [p for p in profiles_result.scalars().all()]
        query = query.where(Enrollment.beneficiary_id.in_(profile_ids))
    
    # Apply filters
    if scheme_id:
        query = query.where(Enrollment.scheme_id == scheme_id)
    if beneficiary_id:
        query = query.where(Enrollment.beneficiary_id == beneficiary_id)
    if status_filter:
        query = query.where(Enrollment.status == status_filter)
    
    query = query.order_by(Enrollment.enrollment_date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/my-enrollments", response_model=List[EnrollmentWithDetails])
async def get_my_enrollments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's enrollments"""
    # Get user's beneficiary profile
    profile_result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.user_id == current_user.id)
    )
    profile = profile_result.scalar_one_or_none()
    
    if not profile:
        return []
    
    # Get enrollments
    result = await db.execute(
        select(Enrollment).where(Enrollment.beneficiary_id == profile.id)
    )
    enrollments = result.scalars().all()
    
    # Enrich with scheme names
    enriched = []
    for enrollment in enrollments:
        scheme_result = await db.execute(
            select(Scheme.scheme_name).where(Scheme.id == enrollment.scheme_id)
        )
        scheme_name = scheme_result.scalar_one_or_none()
        
        enriched.append(EnrollmentWithDetails(
            **{c.name: getattr(enrollment, c.name) for c in enrollment.__table__.columns},
            scheme_name=scheme_name,
            beneficiary_name=profile.name
        ))
    
    return enriched


@router.post("/", response_model=EnrollmentRead, status_code=status.HTTP_201_CREATED)
async def create_enrollment(
    enrollment_data: EnrollmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Enroll a beneficiary in a scheme"""
    # Verify scheme exists
    scheme_result = await db.execute(
        select(Scheme).where(Scheme.id == enrollment_data.scheme_id)
    )
    scheme = scheme_result.scalar_one_or_none()
    
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheme not found"
        )
    
    # Verify beneficiary exists
    ben_result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == enrollment_data.beneficiary_id)
    )
    beneficiary = ben_result.scalar_one_or_none()
    
    if not beneficiary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beneficiary not found"
        )
    
    # Check if already enrolled
    existing_result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.scheme_id == enrollment_data.scheme_id,
                Enrollment.beneficiary_id == enrollment_data.beneficiary_id
            )
        )
    )
    existing = existing_result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already enrolled in this scheme"
        )
    
    new_enrollment = Enrollment(
        enrolled_by=current_user.id,
        status='active',
        **enrollment_data.model_dump()
    )
    
    db.add(new_enrollment)
    
    # Increment scheme enrollment count
    scheme.enrolled_count = (scheme.enrolled_count or 0) + 1
    
    await db.commit()
    await db.refresh(new_enrollment)
    
    return new_enrollment


@router.get("/{enrollment_id}", response_model=EnrollmentWithDetails)
async def get_enrollment(
    enrollment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific enrollment"""
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id)
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    
    # Get scheme and beneficiary names
    scheme_result = await db.execute(
        select(Scheme.scheme_name).where(Scheme.id == enrollment.scheme_id)
    )
    scheme_name = scheme_result.scalar_one_or_none()
    
    ben_result = await db.execute(
        select(BeneficiaryProfile.name).where(BeneficiaryProfile.id == enrollment.beneficiary_id)
    )
    beneficiary_name = ben_result.scalar_one_or_none()
    
    return EnrollmentWithDetails(
        **{c.name: getattr(enrollment, c.name) for c in enrollment.__table__.columns},
        scheme_name=scheme_name,
        beneficiary_name=beneficiary_name
    )


@router.put("/{enrollment_id}", response_model=EnrollmentRead)
async def update_enrollment(
    enrollment_id: str,
    update_data: EnrollmentUpdate,
    current_user: User = Depends(require_roles('asha_worker', 'partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """Update an enrollment status (staff only)"""
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id)
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(enrollment, field, value)
    
    await db.commit()
    await db.refresh(enrollment)
    
    return enrollment


@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_enrollment(
    enrollment_id: str,
    current_user: User = Depends(require_roles('partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """Delete an enrollment (admin only)"""
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id)
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    
    # Decrement scheme enrollment count
    scheme_result = await db.execute(
        select(Scheme).where(Scheme.id == enrollment.scheme_id)
    )
    scheme = scheme_result.scalar_one_or_none()
    if scheme and scheme.enrolled_count > 0:
        scheme.enrolled_count -= 1
    
    await db.delete(enrollment)
    await db.commit()
