FROM python:3.11-slim

# 1. Pull the uv binary directly from Astral's official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# 2. Configure uv for a Docker environment
ENV UV_SYSTEM_PYTHON=1
ENV UV_COMPILE_BYTECODE=1

WORKDIR /app

# 3. Copy dependency files FIRST (Optimizes Docker layer caching)
COPY services/recommendation-service/requirements.txt .

# 4. Install dependencies instantly
RUN uv pip install --no-cache -r requirements.txt

# 5. Copy shared code, alembic migrations, and application code
COPY shared ./shared
COPY services/recommendation-service/app ./app
COPY services/recommendation-service/alembic ./alembic
COPY services/recommendation-service/alembic.ini .

EXPOSE 8000

# 6. Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
