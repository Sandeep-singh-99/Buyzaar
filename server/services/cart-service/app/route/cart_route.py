from fastapi import APIRouter, Depends, status, Request, Query, Form, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder
import json
from shared.redis.client import get_redis
from shared.config import CACHE_TTL_CART
from app.db.db import get_db
from app.schema.cart_schema import CartItem, CartItemResponse, CartItemDeleteRequest
from app.model.cart import Cart
from shared.dependencies import get_current_user, TokenData
import httpx

router = APIRouter()

@router.post("/add-cart-item")
async def add_cart_item(
    cart_item: CartItem,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    # VERIFY PRODUCT
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"http://product-service:8000/api/products/find-product/{cart_item.product_id}"
        )

    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="Product not found")

    # CHECK EXISTING ITEM
    existing_item = (
        db.query(Cart)
        .filter(
            Cart.user_id == current_user.user_id,
            Cart.product_id == cart_item.product_id,
        )
        .first()
    )

    # UPDATE QUANTITY
    if existing_item:
        existing_item.quantity += cart_item.quantity
        db.commit()
        db.refresh(existing_item)
        
        # Invalidate user's cart cache
        get_redis().delete(f"cart:{current_user.user_id}")
        return {"message": "Cart updated", "cart": existing_item}

    # CREATE NEW ITEM
    new_cart_item = Cart(
        user_id=current_user.user_id,
        product_id=cart_item.product_id,
        quantity=cart_item.quantity,
        price=cart_item.price,
    )

    db.add(new_cart_item)
    db.commit()
    db.refresh(new_cart_item)

    # Invalidate user's cart cache
    get_redis().delete(f"cart:{current_user.user_id}")

    return {"message": "Item added to cart", "cart": new_cart_item}


@router.get("/get-cart-items")
async def get_cart_items(
    db: Session = Depends(get_db), 
    current_user: TokenData = Depends(get_current_user)
):
    # 1. Check Redis Cache First
    cache_key = f"cart:{current_user.user_id}"
    cached_cart = get_redis().get(cache_key)
    
    if cached_cart:
        return json.loads(cached_cart)

    # 2. Database Fallback
    cart_items = db.query(Cart).filter(Cart.user_id == current_user.user_id).all()

    if not cart_items:
        response_data = {"total_items": 0, "total_price": 0, "products": []}
        get_redis().setex(cache_key, CACHE_TTL_CART, json.dumps(response_data))
        return response_data

    product_ids = [str(item.product_id) for item in cart_items]

    # FETCH PRODUCTS FROM PRODUCT SERVICE
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://product-service:8000/api/products/find-products", json=product_ids
        )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch products")

    products = response.json()["products"]

    # MAP PRODUCT ID -> PRODUCT
    product_map = {product["id"]: product for product in products}

    result = []
    total_price = 0

    for item in cart_items:
        product = product_map.get(str(item.product_id))

        if not product:
            continue

        subtotal = item.quantity * item.price
        total_price += subtotal

        result.append(
            {
                "cart_id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": item.price,
                "subtotal": subtotal,
                "product": product,
            }
        )

    response_data = {
        "total_items": len(result), 
        "total_price": total_price, 
        "products": result
    }

    # 3. Save to Redis Cache
    get_redis().setex(cache_key, CACHE_TTL_CART, json.dumps(jsonable_encoder(response_data)))

    return response_data


@router.delete("/delete-cart-item/{product_id}")
async def delete_cart_item(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    cart_item = (
        db.query(Cart)
        .filter(Cart.user_id == current_user.user_id, Cart.product_id == product_id)
        .first()
    )

    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(cart_item)
    db.commit()

    # Invalidate user's cart cache
    get_redis().delete(f"cart:{current_user.user_id}")

    return {"message": "Cart item deleted"}


@router.delete("/clear-cart")
async def clear_cart(
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    db.query(Cart).filter(Cart.user_id == current_user.user_id).delete()
    db.commit()

    # Invalidate user's cart cache
    get_redis().delete(f"cart:{current_user.user_id}")

    return {"message": "Cart cleared"}


@router.delete("/user/{user_id}")
@router.delete("/cart/user/{user_id}")
async def clear_user_cart_by_id(
    user_id: str,
    db: Session = Depends(get_db),
):
    db.query(Cart).filter(Cart.user_id == user_id).delete()
    db.commit()

    try:
        get_redis().delete(f"cart:{user_id}")
    except Exception as e:
        print(f"Redis delete error: {e}")

    return {"message": f"Cart cleared for user {user_id}"}
