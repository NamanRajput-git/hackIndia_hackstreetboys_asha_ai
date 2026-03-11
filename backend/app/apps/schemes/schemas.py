from datetime import datetime, date
from typing import Optional, List, Dict, Literal
from pydantic import BaseModel
import uuid


class MicrositeConfig(BaseModel):
    """Microsite configuration schema"""
    themeColor: Optional[str] = None
    aboutSection: Optional[Dict] = None
    tasks: Optional[List[Dict]] = []
    customFormFields: Optional[List[Dict]] = []


class SchemeBase(BaseModel):
    """Base scheme schema"""
    scheme_name: str
    provider: Literal['Govt', 'NGO']
    category: Literal['financial', 'nutrition', 'health']
    description: Optional[str] = None
    hero_image: Optional[str] = None
    benefits: Optional[List[str]] = []
    eligibility_criteria: Optional[List[str]] = []
    target_audience: Optional[Dict] = None
    status: Literal['active', 'draft', 'closed'] = 'active'
    budget: Optional[float] = 0
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    microsite_config: Optional[MicrositeConfig] = None


class SchemeCreate(SchemeBase):
    """Schema for creating a scheme"""
    pass


class SchemeUpdate(BaseModel):
    """Schema for updating a scheme"""
    scheme_name: Optional[str] = None
    provider: Optional[Literal['Govt', 'NGO']] = None
    category: Optional[Literal['financial', 'nutrition', 'health']] = None
    description: Optional[str] = None
    hero_image: Optional[str] = None
    benefits: Optional[List[str]] = None
    eligibility_criteria: Optional[List[str]] = None
    target_audience: Optional[Dict] = None
    status: Optional[Literal['active', 'draft', 'closed']] = None
    budget: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    microsite_config: Optional[MicrositeConfig] = None


class SchemeRead(SchemeBase):
    """Schema for reading a scheme"""
    id: uuid.UUID
    enrolled_count: int = 0
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class SchemeWithDetails(SchemeRead):
    """Scheme with creator details"""
    creator_name: Optional[str] = None
