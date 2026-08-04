from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from uuid import uuid4
import enum

from app.db.database import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    user_id = Column(
        String, nullable=False, index=True
    )  
    order_number = Column(String, unique=True, nullable=False, index=True)

    # Use Numeric(precision, scale) for exact financial math
    total_amount = Column(Numeric(10, 2), nullable=False)

    payment_status = Column(Enum(PaymentStatus, native_enum=False), default=PaymentStatus.PENDING)
    status = Column(String, default="pending", nullable=False)

    shipping_name = Column(String)
    shipping_address1 = Column(String)
    shipping_city = Column(String)
    shipping_state = Column(String)
    shipping_postal_code = Column(String)
    shipping_country = Column(String)
    shipping_phone = Column(String)
    shipping_email = Column(String)

    payment_provider = Column(String, default="Cashfree Payment Gateway", nullable=True)

    @property
    def shipping_address(self) -> dict | None:
        if not (self.shipping_address1 or self.shipping_name):
            return None
        return {
            "name": self.shipping_name,
            "address_line1": self.shipping_address1 or "",
            "address_line2": None,
            "city": self.shipping_city or "",
            "state": self.shipping_state or "",
            "postal_code": self.shipping_postal_code or "",
            "country": self.shipping_country or "India",
            "phone": self.shipping_phone,
            "email": self.shipping_email,
        }

    # Modern timezone-aware datetime
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    items = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    order_id = Column(
        String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    product_id = Column(String, nullable=False)

    product_name = Column(String, nullable=False)
    product_image = Column(String)

    # Numeric for exact financial math
    price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)

    category = Column(String, nullable=True)
    variant = Column(String, nullable=True)
    sku = Column(String, nullable=True)

    order = relationship("Order", back_populates="items")

