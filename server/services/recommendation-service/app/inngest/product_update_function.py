import inngest
from app.core.inngest import inngest_client
from app.core.db import SessionLocal
import json

@inngest_client.create_function(
    fn_id="product-updated-rag",
    trigger=inngest.TriggerEvent(event="product.updated"),
)
async def product_updated_rag(ctx):
    product_id = ctx.event.data["product_id"]