from datetime import datetime, date
from typing import Optional, List, Literal
from pydantic import BaseModel
import uuid


class DailyLogBase(BaseModel):
    """Base daily log schema"""
    date: date
    mood: Optional[Literal['Happy', 'Neutral', 'Sad', 'Tired', 'Anxious', 'Pain']] = None
    symptoms: Optional[List[str]] = []
    notes: Optional[str] = None
    flow: Optional[Literal['Light', 'Medium', 'Heavy']] = None


class DailyLogCreate(DailyLogBase):
    """Schema for creating a daily log"""
    pass


class DailyLogUpdate(BaseModel):
    """Schema for updating a daily log"""
    mood: Optional[Literal['Happy', 'Neutral', 'Sad', 'Tired', 'Anxious', 'Pain']] = None
    symptoms: Optional[List[str]] = None
    notes: Optional[str] = None
    flow: Optional[Literal['Light', 'Medium', 'Heavy']] = None


class DailyLogRead(DailyLogBase):
    """Schema for reading a daily log"""
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
