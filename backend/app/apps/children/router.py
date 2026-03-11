from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.apps.users.models import User
from app.apps.beneficiaries.models import BeneficiaryProfile
from app.apps.children.models import Child
from app.apps.children.schemas import (
    ChildCreate,
    ChildRead,
    ChildUpdate,
    ChildWithDetails
)

router = APIRouter(prefix="/children", tags=["Children"])


@router.get("/", response_model=List[ChildRead])
async def list_children(
    beneficiary_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List children with role-based filtering.
    - Beneficiaries: See only their own children
    - ASHA Workers: See children of linked beneficiaries
    - Partners/Admins: See all children
    """
    query = select(Child)
    
    if current_user.role == 'beneficiary':
        # Beneficiaries see only their own children
        profiles_result = await db.execute(
            select(BeneficiaryProfile.id).where(BeneficiaryProfile.user_id == current_user.id)
        )
        profile_ids = [p for p in profiles_result.scalars().all()]
        query = query.where(Child.beneficiary_id.in_(profile_ids))
    elif current_user.role == 'asha_worker':
        # ASHA workers see children of their linked beneficiaries
        linked_result = await db.execute(
            select(BeneficiaryProfile.id).where(
                BeneficiaryProfile.linked_asha_id == current_user.id
            )
        )
        linked_ids = [p for p in linked_result.scalars().all()]
        query = query.where(Child.beneficiary_id.in_(linked_ids))
    
    if beneficiary_id:
        query = query.where(Child.beneficiary_id == beneficiary_id)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=ChildRead, status_code=status.HTTP_201_CREATED)
async def create_child(
    child_data: ChildCreate,
    current_user: User = Depends(require_roles('asha_worker', 'partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a child record.
    ONLY ASHA workers, partners, and admins can add children.
    Beneficiaries cannot add children themselves.
    """
    # Verify beneficiary exists
    result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == child_data.beneficiary_id)
    )
    beneficiary = result.scalar_one_or_none()
    
    if not beneficiary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beneficiary not found"
        )
    
    # For ASHA workers, verify they are linked to this beneficiary
    if current_user.role == 'asha_worker':
        if beneficiary.linked_asha_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only add children for your linked beneficiaries"
            )
    
    new_child = Child(**child_data.model_dump())
    
    db.add(new_child)
    await db.commit()
    await db.refresh(new_child)
    
    return new_child


@router.get("/{child_id}", response_model=ChildWithDetails)
async def get_child(
    child_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific child - read access for all authenticated users with proper permissions"""
    result = await db.execute(
        select(Child).where(Child.id == child_id)
    )
    child = result.scalar_one_or_none()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    # Get beneficiary for permission check
    ben_result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == child.beneficiary_id)
    )
    beneficiary = ben_result.scalar_one_or_none()
    
    # Permission check
    if current_user.role == 'beneficiary':
        if beneficiary.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    elif current_user.role == 'asha_worker':
        if beneficiary.linked_asha_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    return ChildWithDetails(
        **{c.name: getattr(child, c.name) for c in child.__table__.columns},
        beneficiary_name=beneficiary.name if beneficiary else None
    )


@router.put("/{child_id}", response_model=ChildRead)
async def update_child(
    child_id: str,
    update_data: ChildUpdate,
    current_user: User = Depends(require_roles('asha_worker', 'partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a child record.
    ONLY ASHA workers, partners, and admins can update children.
    Beneficiaries cannot modify child records.
    """
    result = await db.execute(
        select(Child).where(Child.id == child_id)
    )
    child = result.scalar_one_or_none()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    # Get parent beneficiary for ASHA permission check
    ben_result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == child.beneficiary_id)
    )
    beneficiary = ben_result.scalar_one_or_none()
    
    # For ASHA workers, verify they are linked to this beneficiary
    if current_user.role == 'asha_worker':
        if beneficiary.linked_asha_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update children for your linked beneficiaries"
            )
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(child, field, value)
    
    await db.commit()
    await db.refresh(child)
    
    return child


@router.delete("/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_child(
    child_id: str,
    current_user: User = Depends(require_roles('asha_worker', 'partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a child record.
    ONLY ASHA workers, partners, and admins can delete children.
    Beneficiaries cannot delete child records.
    """
    result = await db.execute(
        select(Child).where(Child.id == child_id)
    )
    child = result.scalar_one_or_none()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    # Get parent beneficiary for ASHA permission check
    ben_result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == child.beneficiary_id)
    )
    beneficiary = ben_result.scalar_one_or_none()
    
    # For ASHA workers, verify they are linked to this beneficiary
    if current_user.role == 'asha_worker':
        if beneficiary.linked_asha_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete children for your linked beneficiaries"
            )
    
    await db.delete(child)
    await db.commit()


@router.post("/{child_id}/vaccinations/{vaccine_id}", response_model=ChildRead)
async def mark_vaccination_done(
    child_id: str,
    vaccine_id: str,
    current_user: User = Depends(require_roles('asha_worker', 'partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a vaccination as completed for a child.
    ONLY ASHA workers, partners, and admins can mark vaccinations.
    Beneficiaries cannot mark vaccinations themselves.
    """
    result = await db.execute(
        select(Child).where(Child.id == child_id)
    )
    child = result.scalar_one_or_none()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    # Get parent beneficiary for ASHA permission check
    ben_result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == child.beneficiary_id)
    )
    beneficiary = ben_result.scalar_one_or_none()
    
    # For ASHA workers, verify they are linked to this beneficiary
    if current_user.role == 'asha_worker':
        if beneficiary.linked_asha_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only mark vaccinations for children of your linked beneficiaries"
            )
    
    # Add vaccination to list if not already present
    current_vaccinations = child.vaccinations or []
    if vaccine_id not in current_vaccinations:
        child.vaccinations = current_vaccinations + [vaccine_id]
    
    await db.commit()
    await db.refresh(child)
    
    return child


@router.delete("/{child_id}/vaccinations/{vaccine_id}", response_model=ChildRead)
async def remove_vaccination(
    child_id: str,
    vaccine_id: str,
    current_user: User = Depends(require_roles('asha_worker', 'partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a vaccination from a child's record (in case of data entry error).
    ONLY ASHA workers, partners, and admins can modify vaccination records.
    """
    result = await db.execute(
        select(Child).where(Child.id == child_id)
    )
    child = result.scalar_one_or_none()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    # Get parent beneficiary for ASHA permission check
    ben_result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.id == child.beneficiary_id)
    )
    beneficiary = ben_result.scalar_one_or_none()
    
    # For ASHA workers, verify they are linked to this beneficiary
    if current_user.role == 'asha_worker':
        if beneficiary.linked_asha_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only modify vaccinations for children of your linked beneficiaries"
            )
    
    # Remove vaccination from list
    current_vaccinations = child.vaccinations or []
    if vaccine_id in current_vaccinations:
        child.vaccinations = [v for v in current_vaccinations if v != vaccine_id]
    
    await db.commit()
    await db.refresh(child)
    
    return child
