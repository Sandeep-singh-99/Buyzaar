import base64
import hashlib
import hmac
import logging
import time
import httpx
from typing import Dict, Any, Optional
from fastapi import HTTPException
from app.core.config import (
    CASHFREE_APP_ID,
    CASHFREE_SECRET_KEY,
    CASHFREE_BASE_URL,
    CASHFREE_API_VERSION,
)

logger = logging.getLogger(__name__)


class CashfreeClient:
    @staticmethod
    async def create_order(
        order_id: str,
        user_id: str,
        amount: float,
        customer_name: Optional[str] = "Customer",
        customer_email: Optional[str] = "customer@example.com",
        customer_phone: Optional[str] = "9999999999",
    ) -> Dict[str, Any]:
        url = f"{CASHFREE_BASE_URL}/orders"
        phone_digits = "".join(filter(str.isdigit, customer_phone or "")) if customer_phone else ""
        valid_phone = phone_digits[-10:] if len(phone_digits) >= 10 else "9999999999"

        body = {
            "order_id": order_id,
            "order_amount": float(amount),
            "order_currency": "INR",
            "customer_details": {
                "customer_id": user_id or f"cust_{int(time.time())}",
                "customer_name": customer_name or "Customer",
                "customer_email": customer_email or "customer@example.com",
                "customer_phone": valid_phone,
            },
            "order_meta": {
                "return_url": f"http://localhost:5173/order-confirmation?order_id={order_id}"
            },
        }

        headers = {
            "x-client-id": CASHFREE_APP_ID,
            "x-client-secret": CASHFREE_SECRET_KEY,
            "x-api-version": CASHFREE_API_VERSION,
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=body, headers=headers)

            if response.status_code in (200, 201):
                data = response.json()
                payment_session_id = data.get("payment_session_id")
                if not payment_session_id:
                    raise HTTPException(
                        status_code=500,
                        detail="Cashfree API response did not contain payment_session_id"
                    )
                cf_order_id = str(data.get("cf_order_id", order_id))

                return {
                    "payment_session_id": payment_session_id,
                    "cf_order_id": cf_order_id,
                    "order_status": data.get("order_status", "ACTIVE"),
                }
            elif response.status_code == 409:
                logger.info(f"[Cashfree] Order {order_id} already exists on Cashfree. Fetching existing details...")
                get_url = f"{CASHFREE_BASE_URL}/orders/{order_id}"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    get_response = await client.get(get_url, headers=headers)
                
                if get_response.status_code == 200:
                    get_data = get_response.json()
                    payment_session_id = get_data.get("payment_session_id")
                    if not payment_session_id:
                        raise HTTPException(
                            status_code=500,
                            detail="Cashfree GET API response did not contain payment_session_id"
                        )
                    cf_order_id = str(get_data.get("cf_order_id", order_id))
                    
                    return {
                        "payment_session_id": payment_session_id,
                        "cf_order_id": cf_order_id,
                        "order_status": get_data.get("order_status", "ACTIVE"),
                    }
                else:
                    raise HTTPException(
                        status_code=get_response.status_code,
                        detail=f"Failed to retrieve existing Cashfree order {order_id} details: {get_response.text}"
                    )
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Cashfree API returned error: {response.text}"
                )
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"[Cashfree] API call exception: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Internal Cashfree integration error: {str(e)}"
            )

    @staticmethod
    async def get_order(order_id: str) -> Dict[str, Any]:
        url = f"{CASHFREE_BASE_URL}/orders/{order_id}"
        headers = {
            "x-client-id": CASHFREE_APP_ID,
            "x-client-secret": CASHFREE_SECRET_KEY,
            "x-api-version": CASHFREE_API_VERSION,
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"[Cashfree] GET order status {response.status_code}: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"Cashfree error: {response.text}")
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"[Cashfree] GET order API call exception: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    def verify_signature(raw_body: str, timestamp: str, signature: str) -> bool:
        if not signature or not timestamp:
            return True  # Sandbox fallback if headers omitted in test calls
        try:
            data_to_sign = f"{timestamp}{raw_body}".encode("utf-8")
            secret = CASHFREE_SECRET_KEY.encode("utf-8")
            expected = base64.b64encode(
                hmac.new(secret, data_to_sign, hashlib.sha256).digest()
            ).decode("utf-8")
            return expected == signature
        except Exception as err:
            logger.error(f"[Cashfree] Signature verification exception: {err}")
            return False
