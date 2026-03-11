from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel
import uuid

from app.apps.visits.models import VisitStatus, VisitPriority


class VisitBase(BaseModel):
    """Base visit schema"""
    scheduled_date: date
    scheduled_time: Optional[str] = None
    visit_type: str = 'routine_checkup'
    purpose: Optional[str] = None
    notes: Optional[str] = None
    priority: VisitPriority = VisitPriority.NORMAL


class VisitCreate(VisitBase):
    """Schema for creating a visit"""
    beneficiary_id: uuid.UUID


class VisitUpdate(BaseModel):
    """Schema for updating a visit"""
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[str] = None
    visit_type: Optional[str] = None
    purpose: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[VisitStatus] = None
    priority: Optional[VisitPriority] = None


class VisitComplete(BaseModel):
    """Schema for marking a visit as complete"""
    health_log_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class VisitRead(VisitBase):
    """Schema for reading a visit"""
    id: uuid.UUID
    beneficiary_id: uuid.UUID
    asha_worker_id: uuid.UUID
    status: VisitStatus
    completed_at: Optional[datetime] = None
    health_log_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class VisitWithDetails(VisitRead):
    """Visit with related details"""
    beneficiary_name: Optional[str] = None
    beneficiary_user_type: Optional[str] = None
    beneficiary_risk_level: Optional[str] = None
    beneficiary_address: Optional[str] = None
    asha_worker_name: Optional[str] = None


class VisitListResponse(BaseModel):
    """Response for visit list with summary"""
    visits: List[VisitWithDetails]
    total: int
    today_count: int
    overdue_count: int
