import json
import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.models.product_embedding import ProductEmbedding
from app.services.embedding_service import generate_embedding
from shared.redis.client import get_redis
from app.core.config import CACHE_TTL_SHORT

logger = logging.getLogger(__name__)


def search_products(
    db: Session,
    query: str,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """Perform pgvector similarity search in PostgreSQL for products matching query."""
    cache_key = f"rag_search:{query.strip().lower()}:k_{top_k}"
    try:
        redis_client = get_redis()
        if redis_client:
            cached = redis_client.get(cache_key)
            if cached:
                logger.info(f"RAG search cache hit for query: '{query}'")
                return json.loads(cached)
    except Exception as e:
        logger.warning(f"Redis cache check skipped: {e}")

    query_vector = generate_embedding(query)

    # Perform pgvector cosine distance query in PostgreSQL database
    records = (
        db.query(
            ProductEmbedding,
            ProductEmbedding.embedding.cosine_distance(query_vector).label("distance")
        )
        .order_by("distance")
        .limit(top_k)
        .all()
    )

    results = []
    for item, distance in records:
        score = max(0.0, min(1.0, round(1.0 - float(distance), 4)))
        results.append({
            "product_id": str(item.product_id),
            "content": item.content,
            "metadata": item.meta_data,
            "score": score
        })

    try:
        redis_client = get_redis()
        if redis_client:
            redis_client.setex(cache_key, CACHE_TTL_SHORT, json.dumps(results))
    except Exception as e:
        logger.warning(f"Redis cache save skipped: {e}")

    return results
