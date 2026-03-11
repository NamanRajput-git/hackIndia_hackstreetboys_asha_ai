from datetime import datetime, date
from typing import Optional, Literal, Dict
from pydantic import BaseModel, Field
import uuid


class BeneficiaryBase(BaseModel):
    """Base beneficiary schema"""
    name: str
    user_type: Literal['girl', 'pregnant', 'mother'] = 'pregnant'
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    blood_group: Optional[str] = None
    last_period_date: Optional[date] = None
    pregnancy_stage: Optional[str] = None
    pregnancy_week: Optional[int] = None
    edd: Optional[date] = None
    anemia_status: Literal['normal', 'mild', 'moderate', 'severe'] = 'normal'
    risk_level: Literal['low', 'medium', 'high'] = 'low'
    economic_status: Optional[Literal['bpl', 'apl']] = None
    address: Optional[str] = None
    gps_coords: Optional[Dict[str, float]] = None
    medical_history: Optional[str] = None
    current_medications: Optional[str] = None
    complications: Optional[str] = None


class BeneficiaryCreate(BeneficiaryBase):
    """Schema for creating a beneficiary profile"""
    linked_asha_id: Optional[uuid.UUID] = None
    next_checkup_date: Optional[date] = None


class BeneficiaryUpdate(BaseModel):
    """Schema for updating a beneficiary profile"""
    name: Optional[str] = None
    user_type: Optional[Literal['girl', 'pregnant', 'mother']] = None
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    blood_group: Optional[str] = None
    last_period_date: Optional[date] = None
    pregnancy_stage: Optional[str] = None
    pregnancy_week: Optional[int] = None
    edd: Optional[date] = None
    anemia_status: Optional[Literal['normal', 'mild', 'moderate', 'severe']] = None
    risk_level: Optional[Literal['low', 'medium', 'high']] = None
    economic_status: Optional[Literal['bpl', 'apl']] = None
    address: Optional[str] = None
    gps_coords: Optional[Dict[str, float]] = None
    linked_asha_id: Optional[uuid.UUID] = None
    next_checkup_date: Optional[date] = None
    medical_history: Optional[str] = None
    current_medications: Optional[str] = None
    complications: Optional[str] = None


class BeneficiaryRead(BeneficiaryBase):
    """Schema for reading a beneficiary profile"""
    id: uuid.UUID
    user_id: uuid.UUID
    linked_asha_id: Optional[uuid.UUID] = None
    next_checkup_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BeneficiaryWithDetails(BeneficiaryRead):
    """Beneficiary with related data"""
    user_email: Optional[str] = None
    linked_asha_name: Optional[str] = None
    children_count: int = 0
    health_logs_count: int = 0
    alerts_count: int = 0
