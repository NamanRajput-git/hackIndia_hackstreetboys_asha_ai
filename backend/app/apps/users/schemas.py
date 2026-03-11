from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field
import uuid


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    full_name: Optional[str] = None
    role: Literal['beneficiary', 'asha_worker', 'partner', 'admin'] = 'beneficiary'
    phone_number: Optional[str] = None
    language: str = 'hi'
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    """Schema for updating a user"""
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    language: Optional[str] = None
    avatar_url: Optional[str] = None


class UserRead(UserBase):
    """Schema for reading a user"""
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserInDB(UserRead):
    """User with hashed password (internal use only)"""
    password_hash: str


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """JWT payload schema"""
    sub: str
    exp: datetime
    type: str


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    """Refresh token request schema"""
    refresh_token: str
