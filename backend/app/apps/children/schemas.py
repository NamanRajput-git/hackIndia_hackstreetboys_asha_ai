from datetime import date
from typing import Optional, List, Literal
from pydantic import BaseModel
import uuid


class ChildBase(BaseModel):
    """Base child schema"""
    name: str
    dob: Optional[date] = None
    gender: Optional[Literal['male', 'female']] = None
    blood_group: Optional[str] = None
    vaccinations: Optional[List[str]] = []


class ChildCreate(ChildBase):
    """Schema for creating a child"""
    beneficiary_id: uuid.UUID


class ChildUpdate(BaseModel):
    """Schema for updating a child"""
    name: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[Literal['male', 'female']] = None
    blood_group: Optional[str] = None
    vaccinations: Optional[List[str]] = None


class ChildRead(ChildBase):
    """Schema for reading a child"""
    id: uuid.UUID
    beneficiary_id: uuid.UUID
    
    class Config:
        from_attributes = True


class ChildWithDetails(ChildRead):
    """Child with beneficiary details"""
    beneficiary_name: Optional[str] = None
