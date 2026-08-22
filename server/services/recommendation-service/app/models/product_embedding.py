from uuid import uuid4
from sqlalchemy import Column, DateTime, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from pgvector.sqlalchemy import Vector

from app.core.db import Base


class ProductEmbedding(Base):
    __tablename__ = "product_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    product_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    content = Column(
        Text,
        nullable=False
    )

    embedding = Column(
        Vector(384),
        nullable=False
    )

    meta_data = Column(
        JSONB,
        nullable=False,
        default=dict
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
