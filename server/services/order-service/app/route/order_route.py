from math import ceil

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import logging
from decimal import Decimal

from app.db.database import get_db
from app.model.order import Order, OrderItem, PaymentStatus
from app.schema.order import (
    OrderCreate,
    OrderResponse,
    OrderCreateResponse,
    OrderStatusUpdate,
    PaymentStatusCallback,
    AdminOrderResponse,
    AdminOrderSummaryPage,
)
from app.core.http_client import ServiceHTTPClient
from shared.dependencies import get_current_user, TokenData

logger = logging.getLogger("order_service")

router = APIRouter()


def generate_order_number() -> str:
    today_str = datetime.utcnow().strftime("%Y%m%d")
    unique_suffix = uuid.uuid4().hex[:6].upper()
    return f"ORD-{today_str}-{unique_suffix}"


@router.post(
    "",
    response_model=OrderCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Order and Initiate Payment",
    description="Validates product pricing from Product Service, creates Order and OrderItems, and calls Payment Service."
)
@router.post(
    "/",
    response_model=OrderCreateResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False
)
async def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    if not current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User identity could not be verified from token"
        )

    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item"
        )

    # 0. Clean up stale pending orders (older than 15 minutes) for this user to avoid build-up
    expiry_threshold = datetime.now(timezone.utc) - timedelta(minutes=15)
    try:
        stale_orders = db.query(Order).filter(
            Order.user_id == current_user.user_id,
            Order.status == "pending",
            Order.payment_status == PaymentStatus.PENDING,
            Order.created_at < expiry_threshold
        ).all()
        for stale_order in stale_orders:
            stale_order.status = "cancelled"
            stale_order.payment_status = PaymentStatus.CANCELLED
        if stale_orders:
            db.commit()
            logger.info(f"Cancelled {len(stale_orders)} stale pending orders for user {current_user.user_id}")
    except Exception as cleanup_err:
        db.rollback()
        logger.error(f"Error cleaning up stale pending orders: {cleanup_err}")

    # 1. Check if there's a recent pending order (created within last 15 minutes)
    # with the exact same items (product_id and quantity)
    recent_order = db.query(Order).filter(
        Order.user_id == current_user.user_id,
        Order.status == "pending",
        Order.payment_status == PaymentStatus.PENDING,
        Order.created_at >= expiry_threshold
    ).order_by(Order.created_at.desc()).first()

    if recent_order:
        existing_items = {item.product_id: item.quantity for item in recent_order.items}
        new_items = {item.product_id: item.quantity for item in order_data.items}
        
        if existing_items == new_items:
            logger.info(f"Reusing recent pending order: id={recent_order.id}, order_number={recent_order.order_number}")
            
            # Update shipping address if provided
            sa = order_data.shipping_address
            if sa:
                recent_order.shipping_name = sa.name if sa.name else recent_order.shipping_name
                recent_order.shipping_address1 = sa.address_line1 if sa.address_line1 else recent_order.shipping_address1
                recent_order.shipping_city = sa.city if sa.city else recent_order.shipping_city
                recent_order.shipping_state = sa.state if sa.state else recent_order.shipping_state
                recent_order.shipping_postal_code = sa.postal_code if sa.postal_code else recent_order.shipping_postal_code
                recent_order.shipping_country = sa.country if sa.country else recent_order.shipping_country
                recent_order.shipping_phone = sa.phone if sa.phone else recent_order.shipping_phone
                recent_order.shipping_email = sa.email if sa.email else recent_order.shipping_email
                
            try:
                db.commit()
                db.refresh(recent_order)
            except Exception as e:
                db.rollback()
                logger.error(f"Failed to update shipping address for reused order: {e}")
                
            # Request payment link/session from payment service
            cust_name = (sa.name if (sa and sa.name) else None) or current_user.email
            cust_phone = (sa.phone if (sa and sa.phone) else None) or "9999999999"
            cust_email = (sa.email if (sa and sa.email) else None) or current_user.email
            
            payment_payload = {
                "order_id": recent_order.id,
                "user_id": current_user.user_id,
                "amount": float(recent_order.total_amount),
                "customer_name": cust_name,
                "customer_email": cust_email,
                "customer_phone": cust_phone
            }
            
            payment_response = await ServiceHTTPClient.create_payment_order(payment_payload)
            payment_session_id = payment_response.get("payment_session_id")
            payment_mode = payment_response.get("payment_mode")
            
            return OrderCreateResponse(
                message="Checkout resumed for existing pending order",
                order=recent_order,
                payment_session_id=payment_session_id,
                payment_mode=payment_mode
            )

    # 2. Fetch & validate products from Product Service (Never trust frontend price)
    validated_items = []
    total_amount = Decimal("0.00")

    for item in order_data.items:
        product = await ServiceHTTPClient.fetch_product_details(item.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{item.product_id}' not found or unavailable"
            )

        # Extract real price from product service
        sales_price = Decimal(str(product.get("sales_price") or product.get("price") or product.get("product_price") or 0))
        if sales_price <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid pricing for product '{product.get('name') or product.get('product_name', 'Unknown Product')}'"
            )

        # Extract primary image URL if available
        product_image = None
        images = product.get("images", [])
        if images:
            primary_img = next((img.get("url") or img.get("image_url") for img in images if img.get("is_primary")), None)
            product_image = primary_img or images[0].get("url") or images[0].get("image_url")

        subtotal = sales_price * item.quantity
        total_amount += subtotal

        validated_items.append({
            "product_id": item.product_id,
            "product_name": product.get("name") or product.get("product_name") or "Unknown Product",
            "product_image": product_image,
            "price": sales_price,
            "quantity": item.quantity,
            "subtotal": subtotal
        })

    # 2. Generate unique order number
    order_number = generate_order_number()

    # 3. Create Order database record inside a transaction
    sa = order_data.shipping_address
    try:
        new_order = Order(
            user_id=current_user.user_id,
            order_number=order_number,
            total_amount=total_amount,
            payment_status=PaymentStatus.PENDING,
            status="pending",
            shipping_name=sa.name if sa else None,
            shipping_address1=sa.address_line1 if sa else None,
            shipping_city=sa.city if sa else None,
            shipping_state=sa.state if sa else None,
            shipping_postal_code=sa.postal_code if sa else None,
            shipping_country=sa.country if sa else "India",
            shipping_phone=sa.phone if sa else None,
            shipping_email=sa.email if sa else None,
        )
        db.add(new_order)
        db.flush()  # Populates new_order.id

        # Create OrderItem records
        for v_item in validated_items:
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=v_item["product_id"],
                product_name=v_item["product_name"],
                product_image=v_item["product_image"],
                price=v_item["price"],
                quantity=v_item["quantity"],
                subtotal=v_item["subtotal"]
            )
            db.add(order_item)

        db.commit()
        db.refresh(new_order)
        logger.info(f"Order created successfully: id={new_order.id}, order_number={order_number}")

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create order transaction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save order to database"
        )

    # 4. Initiate Payment with Payment Service
    cust_name = (sa.name if (sa and sa.name) else None) or current_user.email
    cust_phone = (sa.phone if (sa and sa.phone) else None) or "9999999999"
    cust_email = (sa.email if (sa and sa.email) else None) or current_user.email

    payment_payload = {
        "order_id": new_order.id,
        "user_id": current_user.user_id,
        "amount": float(total_amount),
        "customer_name": cust_name,
        "customer_email": cust_email,
        "customer_phone": cust_phone
    }

    payment_response = await ServiceHTTPClient.create_payment_order(payment_payload)

    payment_session_id = payment_response.get("payment_session_id")
    payment_mode = payment_response.get("payment_mode")

    return OrderCreateResponse(
        message="Order created successfully",
        order=new_order,
        payment_session_id=payment_session_id,
        payment_mode=payment_mode
    )


@router.get(
    "",
    response_model=List[OrderResponse],
    summary="Get User Orders",
    description="Retrieve all orders for the currently logged-in user."
)
@router.get(
    "/",
    response_model=List[OrderResponse],
    include_in_schema=False
)
async def get_orders(
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    orders = db.query(Order).filter(Order.user_id == current_user.user_id).order_by(Order.created_at.desc()).all()
    return orders


@router.get('/total-orders')
async def get_total_orders(request: Request, db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this resource")

    total_orders = db.query(Order).count()
    return {"total_orders": total_orders}

@router.get(
    "/admin",
    response_model=List[OrderResponse],
    summary="Admin: Get All Orders",
    description="Retrieve all system orders (Admin role required)."
)
async def get_admin_orders(
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return orders

@router.get("/admin/lastest-orders", response_model=List[AdminOrderResponse], summary="Admin: Get Latest Orders", description="Retrieve the 5 most recent orders for admin dashboard.")
async def get_latest_orders(request: Request, db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    if current_user.role != 'ADMIN':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this resource")

    latest_orders = db.query(Order).order_by(Order.created_at.desc()).limit(5).all()

    return [
        AdminOrderResponse(
            order_id=order.id,
            order_number=order.order_number,
            date=order.created_at,
            customer_name=order.shipping_name,
            items=len(order.items),
            status=order.status,
            total=order.total_amount,
        )
        for order in latest_orders
    ]


@router.get("/admin/summary", response_model=AdminOrderSummaryPage, summary="Admin: Get Orders Summary", description="Retrieve a summary of all orders for admin dashboard.")
async def get_admin_orders_summary(request: Request, page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    if current_user.role != 'ADMIN':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this resource")

    total = db.query(Order).count()

    orders = (db.query(Order).order_by(Order.created_at.desc()).offset((page - 1) * limit).limit(limit).all())

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": ceil(total / limit),
        "orders": [
            AdminOrderResponse(
                order_id=order.id,
                order_number=order.order_number,
                date=order.created_at,
                customer_name=order.shipping_name,
                items=len(order.items),
                status=order.status,
                total=order.total_amount,
            )
            for order in orders
        ],
    }

@router.get(
    "/user/{user_id}",
    response_model=List[OrderResponse],
    summary="Get Orders By User ID",
    description="Fetch orders for a specific user ID."
)
async def get_orders_by_user_id(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    # Allow user to view their own orders, or admin to view any user's orders
    if current_user.user_id != user_id and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    return orders


@router.get(
    "/{id}",
    response_model=OrderResponse,
    summary="Get Order Details By Order ID",
    description="Fetch single order details."
)
async def get_order_by_id(
    id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if order.user_id != current_user.user_id and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return order


@router.patch(
    "/{id}/payment-status",
    response_model=OrderResponse,
    summary="Update Order Payment Status (Callback)",
    description="Invoked by Payment Service to update order status upon Cashfree payment verification."
)
async def update_payment_status(
    id: str,
    payload: PaymentStatusCallback,
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    status_str = payload.status.upper() if payload.status else ""

    if status_str == "SUCCESS" or status_str == "CONFIRMED":
        order.payment_status = PaymentStatus.CONFIRMED
        order.status = "confirmed"
    else:
        order.payment_status = PaymentStatus.PENDING
        order.status = "payment_failed"

    try:
        db.commit()
        db.refresh(order)
        logger.info(f"Order payment status updated: id={id}, new_status={order.status}, payment_status={order.payment_status}")
        return order
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update payment status for order_id={id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update order payment status"
        )


@router.patch(
    "/{id}/cancel",
    response_model=OrderResponse,
    summary="Cancel Order",
    description="Cancel an existing pending order."
)
async def cancel_order(
    id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if order.user_id != current_user.user_id and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    if order.status in ("shipped", "delivered"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel order that has already been shipped or delivered"
        )

    order.status = "cancelled"
    order.payment_status = PaymentStatus.CANCELLED

    try:
        db.commit()
        db.refresh(order)
        logger.info(f"Order cancelled: id={id}")
        return order
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to cancel order_id={id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel order"
        )
