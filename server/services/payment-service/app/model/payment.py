import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, Enum as SQLEnum, DateTime, Index
from app.db.database import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, nullable=False, index=True)
    user_id = Column(String, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    provider = Column(String, default="cashfree", nullable=False)
    transaction_id = Column(String, unique=True, nullable=True)
    payment_session_id = Column(String, nullable=True)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
