from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field
from app.model.payment import PaymentStatus


class PaymentCreate(BaseModel):
    order_id: Optional[str] = None
    orderId: Optional[str] = None
    user_id: Optional[str] = None
    userId: Optional[str] = None
    amount: float
    customer_name: Optional[str] = None
    customerName: Optional[str] = None
    customer_email: Optional[str] = None
    customerEmail: Optional[str] = None
    customer_phone: Optional[str] = None
    customerPhone: Optional[str] = None


class PaymentOut(BaseModel):
    id: str
    order_id: str
    user_id: str
    amount: float
    provider: str
    transaction_id: Optional[str] = None
    payment_link: Optional[str] = None
    status: PaymentStatus
    created_at: datetime

    class Config:
        from_attributes = True


class CreatePaymentResponse(BaseModel):
    payment_session_id: str
    payment_link: Optional[str] = None
    payment_mode: str
    order_id: str
    transaction_id: Optional[str] = None
    status: PaymentStatus
    payment_record: Optional[Any] = None


class PaymentHistoryResponse(BaseModel):
    count: int
    payments: list[PaymentOut]
