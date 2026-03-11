from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel
import uuid


class AlertBase(BaseModel):
    """Base alert schema"""
    type: Literal['sos', 'health_risk']
    severity: Literal['medium', 'high', 'critical']
    reason: Optional[str] = None


class AlertCreate(AlertBase):
    """Schema for creating an alert"""
    beneficiary_id: uuid.UUID


class AlertUpdate(BaseModel):
    """Schema for updating an alert (mainly for resolution)"""
    status: Optional[Literal['open', 'resolved']] = None
    resolution_notes: Optional[str] = None


class AlertRead(AlertBase):
    """Schema for reading an alert"""
    id: uuid.UUID
    beneficiary_id: uuid.UUID
    status: Literal['open', 'resolved']
    triggered_by: Optional[uuid.UUID] = None
    resolved_by: Optional[uuid.UUID] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class AlertWithDetails(AlertRead):
    """Alert with beneficiary details"""
    beneficiary_name: Optional[str] = None
    trigger_user_name: Optional[str] = None
    resolver_user_name: Optional[str] = None
