import logging
import inngest
from app.core.inngest import inngest_client
from app.core.db import SessionLocal
from app.services.product_service import product_service_client
from app.services.embedding_service import upsert_product_embedding

logger = logging.getLogger(__name__)


@inngest_client.create_function(
    fn_id="product-created-rag",
    trigger=inngest.TriggerEvent(event="product.created"),
)
async def product_created_rag(ctx: inngest.Context):
    product_id = ctx.event.data["product_id"]
    logger.info(f"Handling product.created for product_id: {product_id}")

    product = await product_service_client.get_product(product_id)
    if not product:
        raise Exception(f"Product {product_id} could not be retrieved from Product Service")

    db = SessionLocal()
    try:
        upsert_product_embedding(db, product)
        logger.info(f"Successfully processed product.created for product_id: {product_id}")
    finally:
        db.close()
