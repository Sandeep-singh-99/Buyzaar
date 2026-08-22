import logging
import inngest
from app.core.inngest import inngest_client
from app.core.db import SessionLocal
from app.services.embedding_service import delete_product_embedding

logger = logging.getLogger(__name__)


@inngest_client.create_function(
    fn_id="product-deleted-rag",
    trigger=inngest.TriggerEvent(event="product.deleted"),
)
async def product_deleted_rag(ctx: inngest.Context):
    product_id = ctx.event.data["product_id"]
    logger.info(f"Handling product.deleted for product_id: {product_id}")

    db = SessionLocal()
    try:
        delete_product_embedding(db, product_id)
        logger.info(f"Successfully processed product.deleted for product_id: {product_id}")
    finally:
        db.close()
