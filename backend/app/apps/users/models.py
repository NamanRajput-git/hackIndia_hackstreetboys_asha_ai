import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class User(Base):
    """User model - linked to authentication"""
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(
        Enum('beneficiary', 'asha_worker', 'partner', 'admin', name='user_role'), 
        default='beneficiary'
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    language: Mapped[str] = mapped_column(String(10), default='hi')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    beneficiary_profiles: Mapped[List["BeneficiaryProfile"]] = relationship(
        "BeneficiaryProfile", 
        back_populates="user",
        foreign_keys="BeneficiaryProfile.user_id"
    )
    daily_logs: Mapped[List["DailyLog"]] = relationship("DailyLog", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.email}>"


# Import to avoid circular imports - these will be in their respective modules
from app.apps.beneficiaries.models import BeneficiaryProfile
from app.apps.daily_logs.models import DailyLog
