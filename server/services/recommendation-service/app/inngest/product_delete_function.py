import inngest
from app.core.inngest import inngest_client
from app.core.db import SessionLocal
import json

@inngest_client.create_function(
    fn_id="product-delete-rag",
    trigger=inngest.TriggerEvent(event="product.deleted"),
)
async def product_deleted_rag(ctx):
    product_id = ctx.event.data["product_id"]