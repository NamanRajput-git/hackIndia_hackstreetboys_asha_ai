from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.security import get_current_user
from app.apps.users.models import User
from app.apps.daily_logs.models import DailyLog
from app.apps.daily_logs.schemas import (
    DailyLogCreate,
    DailyLogRead,
    DailyLogUpdate
)

router = APIRouter(prefix="/daily-logs", tags=["Daily Logs"])


@router.get("/", response_model=List[DailyLogRead])
async def list_daily_logs(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List daily logs for current user"""
    query = select(DailyLog).where(DailyLog.user_id == current_user.id)
    
    if start_date:
        query = query.where(DailyLog.date >= start_date)
    if end_date:
        query = query.where(DailyLog.date <= end_date)
    
    query = query.order_by(DailyLog.date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/today", response_model=Optional[DailyLogRead])
async def get_today_log(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get today's daily log"""
    today = date.today()
    result = await db.execute(
        select(DailyLog).where(
            and_(
                DailyLog.user_id == current_user.id,
                DailyLog.date == today
            )
        )
    )
    return result.scalar_one_or_none()


@router.post("/", response_model=DailyLogRead, status_code=status.HTTP_201_CREATED)
async def create_daily_log(
    log_data: DailyLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create or update a daily log (upsert on date)"""
    # Check if log exists for this date
    result = await db.execute(
        select(DailyLog).where(
            and_(
                DailyLog.user_id == current_user.id,
                DailyLog.date == log_data.date
            )
        )
    )
    existing_log = result.scalar_one_or_none()
    
    if existing_log:
        # Update existing log
        for field, value in log_data.model_dump(exclude_unset=True).items():
            setattr(existing_log, field, value)
        await db.commit()
        await db.refresh(existing_log)
        return existing_log
    
    # Create new log
    new_log = DailyLog(
        user_id=current_user.id,
        **log_data.model_dump()
    )
    
    db.add(new_log)
    await db.commit()
    await db.refresh(new_log)
    
    return new_log


@router.get("/{log_id}", response_model=DailyLogRead)
async def get_daily_log(
    log_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific daily log"""
    result = await db.execute(
        select(DailyLog).where(DailyLog.id == log_id)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Daily log not found"
        )
    
    if log.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return log


@router.put("/{log_id}", response_model=DailyLogRead)
async def update_daily_log(
    log_id: str,
    update_data: DailyLogUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a daily log"""
    result = await db.execute(
        select(DailyLog).where(DailyLog.id == log_id)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Daily log not found"
        )
    
    if log.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(log, field, value)
    
    await db.commit()
    await db.refresh(log)
    
    return log


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_daily_log(
    log_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a daily log"""
    result = await db.execute(
        select(DailyLog).where(DailyLog.id == log_id)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Daily log not found"
        )
    
    if log.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    await db.delete(log)
    await db.commit()
