import json
import logging
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.model.payment import Payment, PaymentStatus
from app.schema.payment import PaymentCreate, PaymentOut, CreatePaymentResponse, PaymentHistoryResponse
from app.core.cashfree import CashfreeClient
from app.core.http_client import ServiceHTTPClient
from app.core.config import CASHFREE_BASE_URL

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payment Service"])
webhook_router = APIRouter(tags=["Cashfree Webhook"])


@router.post("/create", response_model=CreatePaymentResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=CreatePaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db)
):
    order_id = payload.order_id or payload.orderId
    user_id = payload.user_id or payload.userId
    amount = payload.amount
    customer_name = payload.customer_name or payload.customerName or "Customer"
    customer_email = payload.customer_email or payload.customerEmail or "customer@example.com"
    customer_phone = payload.customer_phone or payload.customerPhone or "9999999999"

    if not order_id or not user_id or not amount:
        raise HTTPException(
            status_code=400,
            detail="Missing required parameters: order_id, user_id, and amount are required."
        )

    cashfree_res = await CashfreeClient.create_order(
        order_id=order_id,
        user_id=user_id,
        amount=amount,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
    )

    transaction_id = cashfree_res.get("cf_order_id") or f"tx_{order_id}"
    session_id = cashfree_res.get("payment_session_id")

    existing_payment = db.query(Payment).filter(Payment.order_id == order_id).first()

    if existing_payment:
        existing_payment.amount = amount
        existing_payment.transaction_id = transaction_id
        existing_payment.payment_session_id = session_id
        existing_payment.status = PaymentStatus.PENDING
        db.commit()
        db.refresh(existing_payment)
        payment_record = existing_payment
    else:
        payment_record = Payment(
            order_id=order_id,
            user_id=user_id,
            amount=amount,
            provider="cashfree",
            transaction_id=transaction_id,
            payment_session_id=session_id,
            status=PaymentStatus.PENDING,
        )
        db.add(payment_record)
        db.commit()
        db.refresh(payment_record)

    return CreatePaymentResponse(
        payment_session_id=session_id,
        payment_mode="sandbox" if "sandbox" in CASHFREE_BASE_URL.lower() else "production",
        order_id=order_id,
        transaction_id=transaction_id,
        status=payment_record.status,
        payment_record={
            "id": payment_record.id,
            "order_id": payment_record.order_id,
            "user_id": payment_record.user_id,
            "amount": float(payment_record.amount),
            "provider": payment_record.provider,
            "transaction_id": payment_record.transaction_id,
            "payment_session_id": payment_record.payment_session_id,
            "status": payment_record.status.value,
        }
    )


@router.post("/webhook")
@webhook_router.post("/webhook/cashfree")
async def handle_cashfree_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        raw_body_bytes = await request.body()
        raw_body = raw_body_bytes.decode("utf-8")
        timestamp = request.headers.get("x-webhook-timestamp", "")
        signature = request.headers.get("x-webhook-signature", "")

        is_valid = CashfreeClient.verify_signature(raw_body, timestamp, signature)
        if not is_valid:
            logger.warning("[Webhook] Invalid Cashfree signature")
            return Response(
                content=json.dumps({"error": "Invalid webhook signature"}),
                status_code=401,
                media_type="application/json"
            )

        body = json.loads(raw_body) if raw_body else {}
        logger.info(f"[Webhook] Received payload: {body}")

        data = body.get("data", body)
        order_obj = data.get("order", data)
        payment_obj = data.get("payment", data)

        order_id = order_obj.get("order_id") or body.get("order_id") or body.get("orderId")
        tx_status = (
            payment_obj.get("payment_status")
            or data.get("payment_status")
            or order_obj.get("order_status")
            or body.get("status")
            or ""
        ).upper()

        cf_payment_id = str(
            payment_obj.get("cf_payment_id")
            or data.get("cf_payment_id")
            or body.get("transaction_id")
            or order_id
        )

        if not order_id:
            raise ValueError("Missing order_id in webhook payload")

        is_success = tx_status in ["SUCCESS", "PAID", "COMPLETED", "CONFIRMED"]
        new_status = PaymentStatus.SUCCESS if is_success else PaymentStatus.FAILED

        existing_payment = db.query(Payment).filter(Payment.order_id == order_id).first()

        if existing_payment and existing_payment.status == PaymentStatus.SUCCESS:
            logger.info(f"[Webhook] Order {order_id} already SUCCESS. Ignoring duplicate.")
            return {"status": "IGNORED_DUPLICATE", "order_id": order_id}

        if existing_payment:
            existing_payment.status = new_status
            existing_payment.transaction_id = cf_payment_id
            db.commit()
            db.refresh(existing_payment)
            updated_payment = existing_payment
        else:
            updated_payment = Payment(
                order_id=order_id,
                user_id=body.get("user_id", "unknown"),
                amount=float(order_obj.get("order_amount") or body.get("amount", 0)),
                provider="cashfree",
                transaction_id=cf_payment_id,
                status=new_status,
            )
            db.add(updated_payment)
            db.commit()
            db.refresh(updated_payment)

        # Notify Order Service
        await ServiceHTTPClient.notify_order_service(
            order_id=order_id,
            status="SUCCESS" if is_success else "FAILED",
            transaction_id=cf_payment_id,
        )

        # Clear Cart on payment success
        if is_success and updated_payment.user_id and updated_payment.user_id != "unknown":
            await ServiceHTTPClient.clear_user_cart(updated_payment.user_id)

        return {
            "status": "PROCESSED",
            "order_id": order_id,
            "payment_status": new_status.value,
            "transaction_id": cf_payment_id,
        }
    except Exception as e:
        logger.error(f"[Webhook Error]: {e}")
        return {"status": "ERROR", "message": str(e)}


@router.get("/history/{user_id}", response_model=PaymentHistoryResponse)
async def get_history_by_user_id(
    user_id: str,
    db: Session = Depends(get_db)
):
    payments = db.query(Payment).filter(Payment.user_id == user_id).order_by(Payment.created_at.desc()).all()
    return PaymentHistoryResponse(
        count=len(payments),
        payments=payments
    )


@router.get("/status/{transaction_id}", response_model=PaymentOut)
async def get_status_by_tx_id(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(Payment.transaction_id == transaction_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment transaction record not found")
    return payment


@router.get("/{order_id}", response_model=PaymentOut)
async def get_by_order_id(
    order_id: str,
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(Payment.order_id == order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")
    return payment


@router.post("/verify/{order_id}")
@router.get("/verify/{order_id}")
async def verify_payment(
    order_id: str,
    db: Session = Depends(get_db)
):
    # Fetch latest status from Cashfree
    cashfree_order = await CashfreeClient.get_order(order_id)
    
    order_status = cashfree_order.get("order_status")
    # In Cashfree, order status can be 'PAID', 'SUCCESS', 'COMPLETED'
    is_success = order_status in ["PAID", "SUCCESS", "COMPLETED"]
    
    new_status = PaymentStatus.SUCCESS if is_success else PaymentStatus.FAILED
    
    existing_payment = db.query(Payment).filter(Payment.order_id == order_id).first()
    cf_payment_id = cashfree_order.get("cf_order_id") or order_id
    
    if existing_payment:
        was_success = existing_payment.status == PaymentStatus.SUCCESS
        existing_payment.status = new_status
        existing_payment.transaction_id = str(cf_payment_id)
        db.commit()
        db.refresh(existing_payment)
        payment_record = existing_payment
    else:
        was_success = False
        payment_record = Payment(
            order_id=order_id,
            user_id="unknown",
            amount=cashfree_order.get("order_amount", 0.0),
            provider="cashfree",
            transaction_id=str(cf_payment_id),
            status=new_status,
        )
        db.add(payment_record)
        db.commit()
        db.refresh(payment_record)
        
    if is_success and not was_success:
        # Notify Order Service
        try:
            await ServiceHTTPClient.notify_order_service(
                order_id=order_id,
                status="SUCCESS",
                transaction_id=str(cf_payment_id),
            )
        except Exception as oe:
            logger.error(f"[Verify] Failed to notify order service: {oe}")
            
        # Clear Cart
        try:
            if payment_record.user_id and payment_record.user_id != "unknown":
                await ServiceHTTPClient.clear_user_cart(payment_record.user_id)
        except Exception as ce:
            logger.error(f"[Verify] Failed to clear cart: {ce}")
            
    return {
        "status": payment_record.status.value,
        "order_id": order_id,
        "transaction_id": payment_record.transaction_id,
        "amount": float(payment_record.amount),
    }
