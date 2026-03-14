import uuid
from datetime import date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Date, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from app.core.database import Base
from app.core.types import GUID, StringArray

if TYPE_CHECKING:
    from app.apps.beneficiaries.models import BeneficiaryProfile


class Child(Base):
    """Children - children of beneficiaries for vaccination tracking etc."""
    __tablename__ = "children"
    
    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    beneficiary_id: Mapped[uuid.UUID] = mapped_column(
        GUID, 
        ForeignKey("beneficiary_profiles.id", ondelete="CASCADE"), 
        nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dob: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(
        Enum('male', 'female', name='gender_type'),
        nullable=True
    )
    blood_group: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    vaccinations: Mapped[Optional[List[str]]] = mapped_column(StringArray, nullable=True)
    
    # Relationships
    beneficiary: Mapped["BeneficiaryProfile"] = relationship("BeneficiaryProfile", back_populates="children")
    
    def __repr__(self):
        return f"<Child {self.name}>"
