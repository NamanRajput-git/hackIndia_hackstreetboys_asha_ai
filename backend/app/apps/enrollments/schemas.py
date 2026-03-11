from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel
import uuid


class EnrollmentBase(BaseModel):
    """Base enrollment schema"""
    status: Literal['pending', 'approved', 'rejected', 'active', 'completed'] = 'pending'


class EnrollmentCreate(BaseModel):
    """Schema for creating an enrollment"""
    scheme_id: uuid.UUID
    beneficiary_id: uuid.UUID


class EnrollmentUpdate(BaseModel):
    """Schema for updating an enrollment"""
    status: Optional[Literal['pending', 'approved', 'rejected', 'active', 'completed']] = None


class EnrollmentRead(EnrollmentBase):
    """Schema for reading an enrollment"""
    id: uuid.UUID
    scheme_id: uuid.UUID
    beneficiary_id: uuid.UUID
    enrolled_by: Optional[uuid.UUID] = None
    enrollment_date: datetime
    
    class Config:
        from_attributes = True


class EnrollmentWithDetails(EnrollmentRead):
    """Enrollment with scheme and beneficiary details"""
    scheme_name: Optional[str] = None
    beneficiary_name: Optional[str] = None
    enrolled_by_name: Optional[str] = None
