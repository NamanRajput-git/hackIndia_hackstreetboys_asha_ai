from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel
import uuid


class HealthLogBase(BaseModel):
    """Base health log schema"""
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    symptoms: Optional[List[str]] = []
    mood: Optional[str] = None
    voice_note_url: Optional[str] = None
    ai_summary: Optional[str] = None
    is_emergency: bool = False
    visit_type: str = 'home'


class HealthLogCreate(HealthLogBase):
    """Schema for creating a health log"""
    beneficiary_id: uuid.UUID
    vitals: Optional[Dict] = None


class HealthLogUpdate(BaseModel):
    """Schema for updating a health log"""
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    symptoms: Optional[List[str]] = None
    mood: Optional[str] = None
    ai_summary: Optional[str] = None
    is_emergency: Optional[bool] = None


class HealthLogRead(HealthLogBase):
    """Schema for reading a health log"""
    id: uuid.UUID
    beneficiary_id: uuid.UUID
    recorded_by: Optional[uuid.UUID] = None
    vitals: Optional[Dict] = None
    date: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


class HealthLogWithDetails(HealthLogRead):
    """Health log with beneficiary details"""
    beneficiary_name: Optional[str] = None
    recorder_name: Optional[str] = None
