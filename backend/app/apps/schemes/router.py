from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.apps.users.models import User
from app.apps.schemes.models import Scheme
from app.apps.schemes.schemas import (
    SchemeCreate,
    SchemeRead,
    SchemeUpdate,
    SchemeWithDetails
)

router = APIRouter(prefix="/schemes", tags=["Schemes"])


@router.get("/", response_model=List[SchemeRead])
async def list_schemes(
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = None,
    provider: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
):
    """List all schemes (public endpoint)"""
    query = select(Scheme)
    
    # Apply filters
    if status_filter:
        query = query.where(Scheme.status == status_filter)
    if category:
        query = query.where(Scheme.category == category)
    if provider:
        query = query.where(Scheme.provider == provider)
    if search:
        query = query.where(Scheme.scheme_name.ilike(f"%{search}%"))
    
    query = query.order_by(Scheme.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/active", response_model=List[SchemeRead])
async def get_active_schemes(
    db: AsyncSession = Depends(get_db)
):
    """Get all active schemes"""
    result = await db.execute(
        select(Scheme).where(Scheme.status == 'active').order_by(Scheme.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=SchemeRead, status_code=status.HTTP_201_CREATED)
async def create_scheme(
    scheme_data: SchemeCreate,
    current_user: User = Depends(require_roles('partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """Create a new scheme (partners only)"""
    new_scheme = Scheme(
        created_by=current_user.id,
        **scheme_data.model_dump()
    )
    
    db.add(new_scheme)
    await db.commit()
    await db.refresh(new_scheme)
    
    return new_scheme


@router.get("/{scheme_id}", response_model=SchemeWithDetails)
async def get_scheme(
    scheme_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific scheme"""
    result = await db.execute(
        select(Scheme).where(Scheme.id == scheme_id)
    )
    scheme = result.scalar_one_or_none()
    
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheme not found"
        )
    
    # Get creator name
    creator_name = None
    if scheme.created_by:
        creator_result = await db.execute(
            select(User.full_name).where(User.id == scheme.created_by)
        )
        creator_name = creator_result.scalar_one_or_none()
    
    return SchemeWithDetails(
        **{c.name: getattr(scheme, c.name) for c in scheme.__table__.columns},
        creator_name=creator_name
    )


@router.put("/{scheme_id}", response_model=SchemeRead)
async def update_scheme(
    scheme_id: str,
    update_data: SchemeUpdate,
    current_user: User = Depends(require_roles('partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """Update a scheme (partners only)"""
    result = await db.execute(
        select(Scheme).where(Scheme.id == scheme_id)
    )
    scheme = result.scalar_one_or_none()
    
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheme not found"
        )
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(scheme, field, value)
    
    await db.commit()
    await db.refresh(scheme)
    
    return scheme


@router.delete("/{scheme_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scheme(
    scheme_id: str,
    current_user: User = Depends(require_roles('partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """Delete a scheme (partners only)"""
    result = await db.execute(
        select(Scheme).where(Scheme.id == scheme_id)
    )
    scheme = result.scalar_one_or_none()
    
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheme not found"
        )
    
    await db.delete(scheme)
    await db.commit()


@router.get("/{scheme_id}/stats")
async def get_scheme_stats(
    scheme_id: str,
    current_user: User = Depends(require_roles('partner', 'admin')),
    db: AsyncSession = Depends(get_db)
):
    """Get enrollment statistics for a scheme"""
    result = await db.execute(
        select(Scheme).where(Scheme.id == scheme_id)
    )
    scheme = result.scalar_one_or_none()
    
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheme not found"
        )
    
    from app.apps.enrollments.models import Enrollment
    
    # Get enrollment counts by status
    from sqlalchemy import case
    
    stats_result = await db.execute(
        select(
            func.count().label('total'),
            func.count().filter(Enrollment.status == 'pending').label('pending'),
            func.count().filter(Enrollment.status == 'approved').label('approved'),
            func.count().filter(Enrollment.status == 'active').label('active'),
            func.count().filter(Enrollment.status == 'completed').label('completed'),
            func.count().filter(Enrollment.status == 'rejected').label('rejected'),
        ).where(Enrollment.scheme_id == scheme_id)
    )
    stats = stats_result.one()
    
    return {
        "scheme_id": scheme_id,
        "scheme_name": scheme.scheme_name,
        "total_enrollments": stats.total,
        "by_status": {
            "pending": stats.pending,
            "approved": stats.approved,
            "active": stats.active,
            "completed": stats.completed,
            "rejected": stats.rejected
        }
    }
