import logging
import inngest
from app.core.inngest import inngest_client
from app.core.db import SessionLocal
from app.services.product_service import product_service_client
from app.services.embedding_service import upsert_product_embeddings_batch

logger = logging.getLogger(__name__)


@inngest_client.create_function(
    fn_id="sync-all-products",
    trigger=inngest.TriggerEvent(event="recommendation/products.sync"),
)
async def sync_all_products(ctx: inngest.Context):
    logger.info("Executing full product RAG embedding synchronization...")
    products = await product_service_client.sync_all_products()
    logger.info(f"Retrieved {len(products)} products from Product Service")

    db = SessionLocal()
    try:
        synced_count = upsert_product_embeddings_batch(db, products)
        logger.info(f"Successfully synchronized {synced_count} product embeddings")
    finally:
        db.close()

    return {"synced": synced_count}
