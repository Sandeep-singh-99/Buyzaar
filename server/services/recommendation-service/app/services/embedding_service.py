import logging
from typing import Dict, Any, List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.product_embedding import ProductEmbedding
from app.embeddings.huggingface import get_embeddings

logger = logging.getLogger(__name__)


def create_product_content(product: Dict[str, Any]) -> str:
    """Create deterministic searchable text representation of a product for embedding."""
    name = product.get("name") or product.get("product_name") or ""
    brand = product.get("brand") or product.get("product_brand") or ""
    category = product.get("category") or product.get("product_category") or ""
    price = product.get("price") if product.get("price") is not None else product.get("product_price", "")
    sales_price = product.get("sales_price", "")
    description = product.get("description") or product.get("product_description") or ""
    details = product.get("details") or product.get("product_details") or ""

    return f"""Product Name: {name}

Brand: {brand}

Category: {category}

Price: {price}

Sale Price: {sales_price}

Description:
{description}

Product Details:
{details}""".strip()


def generate_embedding(content: str) -> List[float]:
    """Generate a 384-dimensional vector embedding using HuggingFace sentence-transformers."""
    embeddings_model = get_embeddings()
    return embeddings_model.embed_query(content)


def extract_primary_image_info(product: Dict[str, Any]) -> tuple[Optional[str], Optional[str]]:
    """Extract primary image URL and public_id from product data dictionary."""
    primary_image = product.get("primary_image")
    if primary_image and isinstance(primary_image, dict):
        return primary_image.get("url"), primary_image.get("public_id")

    images = product.get("images")
    if images and isinstance(images, list):
        primary = next((img for img in images if isinstance(img, dict) and img.get("is_primary")), images[0])
        if isinstance(primary, dict):
            return primary.get("url"), primary.get("public_id")

    return None, None


def upsert_product_embedding(db: Session, product: Dict[str, Any]) -> ProductEmbedding:
    """Create or update a ProductEmbedding record in PostgreSQL vector database."""
    raw_id = product.get("id") or product.get("product_id")
    if not raw_id:
        raise ValueError("Product payload missing 'id' or 'product_id'")

    product_id = UUID(str(raw_id)) if not isinstance(raw_id, UUID) else raw_id

    content = create_product_content(product)
    vector = generate_embedding(content)

    name = product.get("name") or product.get("product_name") or ""
    brand = product.get("brand") or product.get("product_brand") or ""
    category = product.get("category") or product.get("product_category") or ""
    price = product.get("price") if product.get("price") is not None else product.get("product_price", 0.0)
    sales_price = product.get("sales_price", price)
    image_url, public_id = extract_primary_image_info(product)

    meta_data = {
        "product_id": str(product_id),
        "name": name,
        "brand": brand,
        "category": category,
        "price": price,
        "sales_price": sales_price,
    }
    if image_url:
        meta_data["image_url"] = image_url
    if public_id:
        meta_data["public_id"] = public_id

    existing = db.query(ProductEmbedding).filter(ProductEmbedding.product_id == product_id).first()

    if existing:
        existing.content = content
        existing.embedding = vector
        existing.meta_data = meta_data
        db.commit()
        db.refresh(existing)
        logger.info(f"Updated product embedding for product_id: {product_id}")
        return existing
    else:
        new_embedding = ProductEmbedding(
            product_id=product_id,
            content=content,
            embedding=vector,
            meta_data=meta_data
        )
        db.add(new_embedding)
        db.commit()
        db.refresh(new_embedding)
        logger.info(f"Created new product embedding for product_id: {product_id}")
        return new_embedding


def upsert_product_embeddings_batch(db: Session, products: List[Dict[str, Any]], batch_size: int = 50) -> int:
    """Batch process and upsert product embeddings efficiently using vectorization."""
    if not products:
        return 0

    embeddings_model = get_embeddings()
    total_processed = 0

    for i in range(0, len(products), batch_size):
        chunk = products[i:i + batch_size]
        contents = []
        valid_items = []

        for item in chunk:
            raw_id = item.get("id") or item.get("product_id")
            if not raw_id:
                continue
            p_uuid = UUID(str(raw_id)) if not isinstance(raw_id, UUID) else raw_id
            content = create_product_content(item)
            contents.append(content)
            valid_items.append((p_uuid, item, content))

        if not valid_items:
            continue

        # Generate embeddings for the entire batch at once using embed_documents
        vectors = embeddings_model.embed_documents(contents)

        p_uuids = [v[0] for v in valid_items]
        existing_records = {
            rec.product_id: rec
            for rec in db.query(ProductEmbedding).filter(ProductEmbedding.product_id.in_(p_uuids)).all()
        }

        for (p_uuid, product_data, content), vector in zip(valid_items, vectors):
            name = product_data.get("name") or product_data.get("product_name") or ""
            brand = product_data.get("brand") or product_data.get("product_brand") or ""
            category = product_data.get("category") or product_data.get("product_category") or ""
            price = product_data.get("price") if product_data.get("price") is not None else product_data.get("product_price", 0.0)
            sales_price = product_data.get("sales_price", price)
            image_url, public_id = extract_primary_image_info(product_data)

            meta_data = {
                "product_id": str(p_uuid),
                "name": name,
                "brand": brand,
                "category": category,
                "price": price,
                "sales_price": sales_price,
            }
            if image_url:
                meta_data["image_url"] = image_url
            if public_id:
                meta_data["public_id"] = public_id

            if p_uuid in existing_records:
                existing = existing_records[p_uuid]
                existing.content = content
                existing.embedding = vector
                existing.meta_data = meta_data
            else:
                new_rec = ProductEmbedding(
                    product_id=p_uuid,
                    content=content,
                    embedding=vector,
                    meta_data=meta_data
                )
                db.add(new_rec)

        db.commit()
        total_processed += len(valid_items)
        logger.info(f"Batched upserted {len(valid_items)} product embeddings")

    return total_processed


def delete_product_embedding(db: Session, product_id: str) -> bool:
    """Delete a ProductEmbedding record from PostgreSQL vector database."""
    p_uuid = UUID(str(product_id)) if not isinstance(product_id, UUID) else product_id
    existing = db.query(ProductEmbedding).filter(ProductEmbedding.product_id == p_uuid).first()

    if existing:
        db.delete(existing)
        db.commit()
        logger.info(f"Deleted product embedding for product_id: {p_uuid}")
        return True

    logger.warning(f"No product embedding found to delete for product_id: {p_uuid}")
    return False
