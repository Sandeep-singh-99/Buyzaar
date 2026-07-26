from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from enum import Enum


class PaymentStatusEnum(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    FAILED = "failed"


class ShippingAddress(BaseModel):
    name: Optional[str] = Field(None, description="Full Name of the recipient")
    address_line1: str = Field(..., description="Street address line 1")
    address_line2: Optional[str] = Field(None, description="Apartment, suite, etc.")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State or Region")
    postal_code: str = Field(..., description="ZIP / Postal Code")
    country: str = Field("India", description="Country")
    phone: Optional[str] = Field(None, description="Phone number for delivery")
    email: Optional[str] = Field(None, description="Email address for notifications")


class OrderItemInput(BaseModel):
    product_id: str = Field(..., description="ID of the product being purchased")
    quantity: int = Field(..., gt=0, description="Quantity of items")


class OrderItemBase(BaseModel):
    product_id: str
    product_name: str
    product_image: Optional[str] = None
    price: Decimal = Field(..., gt=0)
    quantity: int = Field(..., gt=0)
    subtotal: Decimal = Field(..., gt=0)


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: str
    order_id: str

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    shipping_address: Optional[ShippingAddress] = None
    items: List[OrderItemInput] = Field(..., min_items=1, description="List of products to order")


class OrderResponse(BaseModel):
    id: str
    user_id: str
    order_number: str
    total_amount: Decimal
    payment_status: str
    status: str
    shipping_name: Optional[str] = None
    shipping_address1: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_postal_code: Optional[str] = None
    shipping_country: Optional[str] = None
    shipping_phone: Optional[str] = None
    shipping_email: Optional[str] = None
    shipping_address: Optional[ShippingAddress] = None
    created_at: datetime
    items: List[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)


class OrderCreateResponse(BaseModel):
    message: str
    order: OrderResponse
    payment_session_id: Optional[str] = None
    payment_link: Optional[str] = None
    payment_mode: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None


class PaymentStatusCallback(BaseModel):
    status: str = Field(..., description="SUCCESS or FAILED from Payment Gateway/Webhook")
    transaction_id: Optional[str] = None