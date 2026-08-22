# Buyzaar AI Recommendation Service

AI-powered recommendation and chat service built with FastAPI, PostgreSQL + pgvector, SQLAlchemy, HuggingFace embeddings (`sentence-transformers/all-MiniLM-L6-v2`), LangChain, Inngest event streaming, Redis caching, and Groq LLM.

---

## 🛠️ Environment Variables

Copy `.env.example` to `.env` and fill in your database, Redis, Product Service, and Groq credentials:

```env
DATABASE_URL_RECOMMENDATION_SERVICE=postgresql://user:password@localhost:5432/buyzaar_recommendation_db
REDIS_URL=redis://localhost:6379/0

PRODUCT_SERVICE_URL=http://localhost:8002
PRODUCT_SERVICE_INTERNAL_TOKEN=your_optional_internal_token

GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

INNGEST_DEV=1
INNGEST_SIGNING_KEY=
```

---

## 🚀 Migration & Database Setup

Make sure the PostgreSQL database is running and has the `pgvector` extension support.

Run Alembic database migration to create the `product_embeddings` table and vector extension:

```bash
alembic upgrade head
```

---

## 🏃 Running the Service

Start the FastAPI application with Uvicorn:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload
```

---

## ⚡ Running Inngest Locally

In development mode, start the Inngest Dev Server:

```bash
npx inngest-cli@latest dev -u http://localhost:8003/api/inngest
```

---

## 🧪 Testing Workflows & APIs

### 1. Synchronize All Products (Admin Button)

Hit the sync endpoint to pull all existing products from Product Service and generate vector embeddings:

```bash
curl -X POST http://localhost:8003/api/rag/sync
```

### 2. RAG Product Vector Search

Search for products using vector semantic similarity:

```bash
curl -X POST http://localhost:8003/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Samsung phone under 50000", "top_k": 5}'
```

### 3. AI Chat with Groq + RAG

Ask the AI recommendation assistant:

```bash
curl -X POST http://localhost:8003/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Suggest a Samsung phone for gaming under 50000"}'
```

### 4. Testing Inngest Events

Send test events via Inngest Dev UI (`http://127.0.0.1:8288`):

#### `product.created`:
```json
{
  "name": "product.created",
  "data": {
    "product_id": "YOUR_PRODUCT_UUID"
  }
}
```

#### `product.updated`:
```json
{
  "name": "product.updated",
  "data": {
    "product_id": "YOUR_PRODUCT_UUID"
  }
}
```

#### `product.deleted`:
```json
{
  "name": "product.deleted",
  "data": {
    "product_id": "YOUR_PRODUCT_UUID"
  }
}
```
