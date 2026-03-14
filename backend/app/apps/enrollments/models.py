import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.core.types import GUID

if TYPE_CHECKING:
    from app.apps.schemes.models import Scheme
    from app.apps.beneficiaries.models import BeneficiaryProfile
    from app.apps.users.models import User


class Enrollment(Base):
    """Enrollments - scheme enrollments for beneficiaries"""
    __tablename__ = "scheme_beneficiaries"
    
    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    scheme_id: Mapped[uuid.UUID] = mapped_column(
        GUID, 
        ForeignKey("schemes.id", ondelete="CASCADE"), 
        nullable=False
    )
    beneficiary_id: Mapped[uuid.UUID] = mapped_column(
        GUID, 
        ForeignKey("beneficiary_profiles.id", ondelete="CASCADE"), 
        nullable=False
    )
    enrolled_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID, 
        ForeignKey("users.id"), 
        nullable=True
    )
    status: Mapped[str] = mapped_column(
        Enum('pending', 'approved', 'rejected', 'active', 'completed', name='enrollment_status'), 
        default='pending'
    )
    enrollment_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="enrollments")
    beneficiary: Mapped["BeneficiaryProfile"] = relationship("BeneficiaryProfile", back_populates="enrollments")
    enrolled_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[enrolled_by])
    
    def __repr__(self):
        return f"<Enrollment scheme={self.scheme_id} beneficiary={self.beneficiary_id}>"
