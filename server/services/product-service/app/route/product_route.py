from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, status, Request, File, Form, Query
from typing import Optional, List
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.exc import IntegrityError
from fastapi.concurrency import run_in_threadpool
from app.db.database import get_db
from app.model.product import Product, ProductImage
from shared.cloudinary import delete_image, upload_multiple_images
from shared.dependencies import get_current_user, TokenData
from fastapi.encoders import jsonable_encoder
from shared.redis.client import get_redis
from shared.config import CACHE_TTL_SHORT, CACHE_TTL_LONG
import json
import asyncio
from typing import List

router = APIRouter()


@router.post("/create-product", status_code=status.HTTP_201_CREATED)
async def create_product(
    request: Request,
    product_name: str = Form(...),
    product_brand: str = Form(...),
    product_price: float = Form(..., ge=0.0),
    sales_price: float = Form(..., ge=0.0),
    product_description: str = Form(...),
    product_details: str = Form(...),
    product_category: str = Form(...),
    images: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    uploaded_public_ids = []

    try:
        new_product = Product(
            product_name=product_name,
            product_brand=product_brand,
            product_price=product_price,
            sales_price=sales_price,
            product_description=product_description,
            product_details=product_details,
            product_category=product_category
        )

        db.add(new_product)
        db.flush()

        for image in images:
            if not image.content_type.startswith("image/"):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image files allowed")

        upload_tasks = [
            run_in_threadpool(upload_multiple_images, image.file, "E-Commerce-Microservices/products")
            for image in images
        ]

        results = await asyncio.gather(*upload_tasks, return_exceptions=True)

        for res in results:
            if isinstance(res, Exception):
                raise res

        for index, result in enumerate(results):
            image_url = result["secure_url"]
            public_id = result["public_id"]
            uploaded_public_ids.append(public_id)

            db.add(ProductImage(
                product_id=new_product.id,
                image_url=image_url,
                public_id=public_id,
                is_primary=(index == 0)
            ))

        db.commit()
        db.refresh(new_product)

        # Clear generic caches that might be affected by a new product
        get_redis().delete("featured_products")

        return {
            "message": "Product created successfully",
            "product_id": new_product.id
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product already exists")

    except Exception as e:
        db.rollback()
        cleanup_tasks = [run_in_threadpool(delete_image, pid) for pid in uploaded_public_ids]
        await asyncio.gather(*cleanup_tasks, return_exceptions=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error: {str(e)}")
    

@router.get("/get-products")
def get_products(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100)
):
    # Check Cache First
    cache_key = f"products:cat_{category}:min_{min_price}:max_{max_price}:s_{search}:p_{page}:l_{limit}"
    cached_data = get_redis().get(cache_key)
    if cached_data:
        return json.loads(cached_data)

    # Database Logic
    query = db.query(Product).options(selectinload(Product.images))

    if category:
        query = query.filter(Product.product_category == category)
    if min_price is not None:
        query = query.filter(Product.sales_price >= min_price)
    if max_price is not None:
        query = query.filter(Product.sales_price <= max_price)
    if search:
        query = query.filter(Product.product_name.ilike(f"%{search}%"))

    total = query.count()
    skip = (page - 1) * limit
    products = query.offset(skip).limit(limit).all()

    result = []
    for product in products:
        result.append({
            "id": product.id,
            "name": product.product_name,
            "brand": product.product_brand,
            "price": product.product_price,
            "sales_price": product.sales_price,
            "category": product.product_category,
            "description": product.product_description,
            "details": product.product_details,
            "images": [{"url": img.image_url, "is_primary": img.is_primary} for img in product.images],
            "created_at": product.created_at
        })

    response_data = {"total": total, "page": page, "limit": limit, "products": result}
    
    # Save to Cache
    get_redis().setex(cache_key, CACHE_TTL_SHORT, json.dumps(jsonable_encoder(response_data)))
    return response_data


@router.get("/get-product/{product_id}")
async def get_product_details(product_id: str, db: Session = Depends(get_db)):
    # Check Cache
    cache_key = f"product_details:{product_id}"
    cached_product = get_redis().get(cache_key)
    if cached_product:
        return json.loads(cached_product)

    product = db.query(Product).options(selectinload(Product.images)).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    response_data = {
        "id": product.id,
        "name": product.product_name,
        "brand": product.product_brand,
        "price": product.product_price,
        "sales_price": product.sales_price,
        "category": product.product_category,
        "description": product.product_description,
        "details": product.product_details,
        "images": [{"url": img.image_url, "is_primary": img.is_primary} for img in product.images],
        "created_at": product.created_at
    }

    # Save to Cache
    get_redis().setex(cache_key, CACHE_TTL_LONG, json.dumps(jsonable_encoder(response_data)))
    return response_data

@router.patch("/update-product/{product_id}")
async def update_product(
    product_id: str,
    request: Request,
    product_name: Optional[str] = Form(None),
    product_brand: Optional[str] = Form(None),
    product_price: Optional[float] = Form(None, ge=0.0),
    sales_price: Optional[float] = Form(None, ge=0.0),
    product_description: Optional[str] = Form(None),
    product_details: Optional[str] = Form(None),
    product_category: Optional[str] = Form(None),
    new_images: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    product = db.query(Product).options(selectinload(Product.images)).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if product_name is not None: product.product_name = product_name
    if product_brand is not None: product.product_brand = product_brand
    if product_price is not None: product.product_price = product_price
    if sales_price is not None: product.sales_price = sales_price
    if product_description is not None: product.product_description = product_description
    if product_details is not None: product.product_details = product_details
    if product_category is not None: product.product_category = product_category

    if new_images is not None and len(new_images) > 0:
        for image in new_images:
            if not image.content_type.startswith("image/"):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image files allowed")

        upload_tasks = [
            run_in_threadpool(upload_multiple_images, image.file, "E-Commerce-Microservices/products")
            for image in new_images
        ]
        results = await asyncio.gather(*upload_tasks, return_exceptions=True)

        for res in results:
            if isinstance(res, Exception):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(res))

        delete_tasks = [run_in_threadpool(delete_image, img.public_id) for img in product.images]
        await asyncio.gather(*delete_tasks, return_exceptions=True)

        for image in new_images:
            db_image = ProductImage(image_url=image.url, public_id=image.public_id, is_primary=False)
            product.images.append(db_image)

    db.commit()
    db.refresh(product)

    response_data = {
        "id": product.id,
        "name": product.product_name,
        "brand": product.product_brand,
        "price": product.product_price,
        "sales_price": product.sales_price,
        "category": product.product_category,
        "description": product.product_description,
        "details": product.product_details,
        "images": [{"url": img.image_url, "is_primary": img.is_primary} for img in product.images],
        "created_at": product.created_at
    }

    # Invalidate Cache and set new data
    get_redis().setex(f"product_details:{product_id}", CACHE_TTL_LONG, json.dumps(jsonable_encoder(response_data)))
    get_redis().delete("featured_products")

    return response_data

@router.get("/get-featured-products")
def get_featured_products(db: Session = Depends(get_db)):
    # Check Cache
    cache_key = "featured_products"
    cached_data = get_redis().get(cache_key)
    if cached_data:
        return json.loads(cached_data)

    categories = db.query(Product.product_category).distinct().limit(8).all()
    
    result = []
    for (category_name,) in categories:
        product = db.query(Product).options(selectinload(Product.images)).filter(Product.product_category == category_name).first()
        if product:
            result.append({
                "id": product.id,
                "name": product.product_name,
                "price": product.product_price,
                "sales_price": product.sales_price,
                "category": product.product_category,
                "images": [{"url": img.image_url, "is_primary": img.is_primary} for img in product.images]
            })
            
    response_data = {"products": result}
    # Save to Cache
    get_redis().setex(cache_key, CACHE_TTL_LONG, json.dumps(jsonable_encoder(response_data)))
    return response_data


@router.get("/get-related-products/{product_id}")
def get_related_products(product_id: str, db: Session = Depends(get_db)):
    cache_key = f"related_products:{product_id}"
    cached_data = get_redis().get(cache_key)
    if cached_data:
        return json.loads(cached_data)

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
    category_name = product.product_category
    related_products = db.query(Product).options(selectinload(Product.images))\
        .filter(Product.product_category == category_name, Product.id != product_id)\
        .limit(6).all()
        
    result = []
    for rel_product in related_products:
        result.append({
            "id": rel_product.id,
            "name": rel_product.product_name,
            "price": rel_product.product_price,
            "sales_price": rel_product.sales_price,
            "category": rel_product.product_category,
            "images": [{"url": img.image_url, "is_primary": img.is_primary} for img in rel_product.images]
        })
        
    response_data = {"products": result}
    get_redis().setex(cache_key, CACHE_TTL_SHORT, json.dumps(jsonable_encoder(response_data)))
    return response_data


@router.get("/get-products-by-category/{category_name}")
def get_products_by_category(
    category_name: str,
    categories: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    sort_by: Optional[str] = Query("featured"),
    page: int = Query(1, ge=1),
    limit: int = Query(8, le=100),
    db: Session = Depends(get_db)
):
    cache_key = f"category_products:{category_name}:cats_{categories}:min_{min_price}:max_{max_price}:s_{sort_by}:p_{page}:l_{limit}"
    cached_data = get_redis().get(cache_key)
    if cached_data:
        return json.loads(cached_data)

    query = db.query(Product).options(selectinload(Product.images))
    
    # 1. Categories Filter
    cat_list = [c.strip() for c in categories.split(",") if c.strip()] if categories else []
    if cat_list:
        category_filters = [Product.product_category.ilike(f"%{c}%") for c in cat_list]
        query = query.filter(or_(*category_filters))
    elif category_name.lower() not in ["all", "view-all", "view all"]:
        query = query.filter(Product.product_category.ilike(f"%{category_name}%"))

    # 2. Price Range Filter
    if min_price is not None:
        query = query.filter(Product.sales_price >= min_price)
    if max_price is not None:
        query = query.filter(Product.sales_price <= max_price)

    # 3. Sorting
    if sort_by == "price-asc":
        query = query.order_by(Product.sales_price.asc())
    elif sort_by == "price-desc":
        query = query.order_by(Product.sales_price.desc())
    elif sort_by == "newest":
        query = query.order_by(Product.created_at.desc())
    else:  # "featured" or default
        query = query.order_by(Product.created_at.desc())

    total = query.count()
    skip = (page - 1) * limit
    products = query.offset(skip).limit(limit).all()
    
    result = []
    for product in products:
        result.append({
            "id": product.id,
            "name": product.product_name,
            "brand": product.product_brand,
            "price": product.product_price,
            "sales_price": product.sales_price,
            "category": product.product_category,
            "description": product.product_description,
            "details": product.product_details,
            "images": [{"url": img.image_url, "is_primary": img.is_primary} for img in product.images],
            "created_at": product.created_at
        })
        
    response_data = {"total": total, "page": page, "limit": limit, "products": result}
    get_redis().setex(cache_key, CACHE_TTL_SHORT, json.dumps(jsonable_encoder(response_data)))
    return response_data


@router.get("/find-product/{product_id}")
async def find_product(product_id: str, db: Session = Depends(get_db)):
    cache_key = f"find_product:{product_id}"
    cached_data = get_redis().get(cache_key)
    if cached_data:
        return json.loads(cached_data)

    product = db.query(Product).options(selectinload(Product.images)).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    response_data = {
        "id": product.id,
        "name": product.product_name,
        "price": product.product_price,
        "sales_price": product.sales_price,
        "category": product.product_category,
        "images": [{"url": img.image_url, "is_primary": img.is_primary} for img in product.images]
    }
    
    get_redis().setex(cache_key, CACHE_TTL_LONG, json.dumps(jsonable_encoder(response_data)))
    return response_data
    

@router.post("/find-products")
async def find_products(product_ids: List[str], db: Session = Depends(get_db)):
    # Sort IDs so that the same group of requested IDs generates the exact same cache key
    sorted_ids_str = ",".join(sorted(product_ids))
    cache_key = f"find_products_batch:{sorted_ids_str}"
    
    cached_data = get_redis().get(cache_key)
    if cached_data:
        return json.loads(cached_data)

    products = db.query(Product).options(selectinload(Product.images)).filter(Product.id.in_(product_ids)).all()

    result = []
    for product in products:
        primary_image = next((img for img in product.images if img.is_primary), None)
        result.append({
            "id": product.id,
            "name": product.product_name,
            "price": product.product_price,
            "sales_price": product.sales_price,
            "category": product.product_category,
            "image": {"url": primary_image.image_url, "is_primary": primary_image.is_primary} if primary_image else None
        })

    response_data = {"products": result}
    get_redis().setex(cache_key, CACHE_TTL_SHORT, json.dumps(jsonable_encoder(response_data)))
    return response_data

@router.get("/total-products")
async def get_total_products(request: Request, db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this resource")

    total_products = db.query(Product).count()
    return {"total_products": total_products}


@router.get("/search")
def search_products(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db)
):
    cache_key = f"search_products:q_{q}:cat_{category}:l_{limit}"
    cached_data = get_redis().get(cache_key)
    if cached_data:
        return json.loads(cached_data)

    query = db.query(Product).options(selectinload(Product.images))

    if q and q.strip():
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Product.product_name.ilike(search_pattern),
                Product.product_brand.ilike(search_pattern),
                Product.product_description.ilike(search_pattern),
                Product.product_category.ilike(search_pattern)
            )
        )

    if category and category.strip() and category.strip().lower() not in ["all", "all categories"]:
        query = query.filter(Product.product_category.ilike(f"%{category.strip()}%"))

    products = query.limit(limit).all()

    result = []
    for product in products:
        result.append({
            "id": product.id,
            "name": product.product_name,
            "brand": product.product_brand,
            "price": product.product_price,
            "sales_price": product.sales_price,
            "category": product.product_category,
            "description": product.product_description,
            "details": product.product_details,
            "images": [{"url": img.image_url, "is_primary": img.is_primary} for img in product.images],
            "created_at": product.created_at
        })

    response_data = {"products": result, "total": len(result)}
    get_redis().setex(cache_key, CACHE_TTL_SHORT, json.dumps(jsonable_encoder(response_data)))
    return response_data


@router.delete("/delete-product/{product_id}")
async def delete_product(product_id: str, db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    product = db.query(Product).options(selectinload(Product.images)).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    delete_tasks = [run_in_threadpool(delete_image, img.public_id) for img in product.images]
    await asyncio.gather(*delete_tasks, return_exceptions=True)

    db.delete(product)
    db.commit()

    # Invalidate Cache
    get_redis().delete(f"product_details:{product_id}")
    get_redis().delete("featured_products")

    return {"message": "Product deleted successfully"}