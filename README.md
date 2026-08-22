# 🌟 Buyzaar

Buyzaar is an enterprise-grade, high-performance, and highly scalable **distributed microservices e-commerce platform**. The project is designed with a strict **database-per-service** model to ensure complete decoupling, scalability, and independent deployment cycles. 

The platform utilizes an **Nginx API Gateway** as a single entry point for routing, **Redis** for distributed high-speed caching (Cache-Aside pattern), and **Neon Serverless PostgreSQL (with pgvector extension)** for database persistence and RAG vector embeddings across all services. The client-side is a feature-rich, modern Single Page Application (SPA) built using React 19, Vite, Tailwind CSS v4, and Shadcn UI.

![E-Commerce Microservices](./screenshot/image.png)
![E-Commerce Microservices](./screenshot/Screenshot%202026-07-26%20142319.png)
![E-Commerce Microservices](./screenshot/Screenshot%202026-07-26%20142429.png)
---

## 📋 Table of Contents
1. [🏗️ System Design & Architecture](#️-system-design--architecture)
2. [🔄 End-to-End System Workflow](#-end-to-end-system-workflow)
3. [⚡ Features](#-features)
4. [🤖 AI Recommendation Service & RAG Architecture](#-ai-recommendation-service--rag-architecture)
5. [🛠️ Technology Stack](#️-technology-stack)
6. [📁 Project Directory Structure](#-project-directory-structure)
7. [🧩 Service Breakdown & Detail](#-service-breakdown--detail)
8. [🛡️ JWT Authentication & Authorization Flow](#️-jwt-authentication--authorization-flow)
9. [🚀 Getting Started](#-getting-started)

---

## 🏗️ System Design & Architecture

Buyzaar implements a modern microservices architecture designed to decouple domain boundaries and scale services independently. Communication between services occurs securely over the internal network using lightweight, asynchronous HTTP REST clients and Inngest event-driven pipelines.

```mermaid
graph TD
    Client["React Frontend (Client)"]
    Gateway["Nginx API Gateway (Port 80/443)"]
    
    %% Services
    UserService["User Service (FastAPI:8000)"]
    ProductService["Product Service (FastAPI:8000)"]
    CartService["Cart Service (FastAPI:8000)"]
    ReviewService["Review Service (FastAPI:8000)"]
    OrderService["Order Service (FastAPI:8000)"]
    PaymentService["Payment Service (FastAPI:5000)"]
    RecommendationService["Recommendation Service (FastAPI:8003)"]
    
    %% Databases & Storage
    UserDB[(Neon PostgreSQL - User DB)]
    ProductDB[(Neon PostgreSQL - Product DB)]
    CartDB[(Neon PostgreSQL - Cart DB)]
    ReviewDB[(Neon PostgreSQL - Review DB)]
    OrderDB[(Neon PostgreSQL - Order DB)]
    PaymentDB[(Neon PostgreSQL - Payment DB)]
    RecommendationDB[(PostgreSQL + pgvector - Vector DB)]
    RedisCache[(Redis Caching)]
    
    %% Third-party & Event Drivers
    Cloudinary["Cloudinary (Image Storage)"]
    Cashfree["Cashfree Payment Gateway"]
    Groq["Groq LLM (llama-3.1-8b-instant)"]
    Inngest["Inngest Event Bus"]

    %% Flow/Connections
    Client <-->|HTTP/REST / Cookies| Gateway
    
    Gateway -->|/auth/*| UserService
    Gateway -->|/api/products/*| ProductService
    Gateway -->|/api/carts/*| CartService
    Gateway -->|/review/*| ReviewService
    Gateway -->|/orders/*| OrderService
    Gateway -->|/payments/* & /webhook/cashfree| PaymentService
    Gateway -->|/api/rag/* & /api/chat| RecommendationService

    %% Database connections
    UserService <--> UserDB
    ProductService <--> ProductDB
    CartService <--> CartDB
    ReviewService <--> ReviewDB
    OrderService <--> OrderDB
    PaymentService <--> PaymentDB
    RecommendationService <--> RecommendationDB
    
    %% AI & Embedding integrations
    RecommendationService <-->|RAG Vector Search| Groq
    ProductService -.->|Publish Event: product.created/updated/deleted| Inngest
    Inngest -.->|Trigger Real-time RAG Vector Sync| RecommendationService
    
    %% Redis & Caching
    ProductService <-->|Read/Write Catalog Cache| RedisCache
    CartService <-->|Read/Write Cart Cache| RedisCache
    ReviewService <-->|Read/Write Review Cache| RedisCache
    RecommendationService <-->|Cache RAG Queries| RedisCache
    
    %% Cloudinary connections
    UserService -->|Upload Avatars| Cloudinary
    ProductService -->|Upload Product Images| Cloudinary
    
    %% Payment integrations
    PaymentService <-->|Initialize Session / Verify Signatures| Cashfree
    Cashfree -->|Webhook Event| Gateway
    
    %% Internal service-to-service calls
    PaymentService -.->|Notify Payment Status| OrderService
    PaymentService -.->|Clear Cart on Success| CartService
    OrderService -.->|Validate Prices & Stock| ProductService
    OrderService -.->|Create Payment Session| PaymentService
    CartService -.->|Fetch Product Metadata| ProductService
    RecommendationService -.->|Fetch Product Details| ProductService
```

### Architectural Key Concepts
1. **API Gateway Pattern**: An Nginx Gateway routes external client traffic to respective services based on path rules. It provides a single IP access point, handles CORS preflight challenges, aggregates paths, and handles SSL/TLS termination.
2. **Database-Per-Service**: To prevent tight coupling, each microservice has its own isolated schema and PostgreSQL database hosted on **Neon Serverless Postgres**. The Recommendation Service uses **PostgreSQL + pgvector** for high-dimensional vector similarity indexing.
3. **Distributed Caching**: A Redis cache is utilized to speed up catalog queries, RAG similarity search results, active shopping carts, and reviews.
4. **Event-Driven RAG Synchronization**: Product Service publishes `product.created`, `product.updated`, and `product.deleted` events to **Inngest**. The Recommendation Service consumes these events asynchronously to update its vector embeddings in real time without blocking main CRUD flows.

---

## 🔄 End-to-End System Workflow

### The Checkout & Payment Lifecycle
Here is how Buyzaar processes an order from the user's shopping cart through transaction confirmation and state reconciliation:

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer (Client)
    participant GW as Nginx Gateway
    participant Cart as Cart Service
    participant Prod as Product Service
    participant Ord as Order Service
    participant Pay as Payment Service
    participant CF as Cashfree PG
    
    User->>GW: POST /orders (Create Order request)
    GW->>Ord: Forward request with cookies (access_token)
    Note over Ord: Auth verification using shared JWT dependency
    
    Ord->>Ord: Cleanup stale pending orders (>15m)
    Ord->>Ord: Match recent pending orders (reuse checkout)
    
    loop For each Item in Order
        Ord->>Prod: GET /api/products/find-product/{product_id}
        Prod-->>Ord: Return validated sales_price & stock state
    end
    
    Ord->>Ord: Calculate total amount & create pending Order in DB
    Ord->>Pay: POST /payments/create (order_id, user_id, amount, customer_details)
    
    Pay->>CF: API Call: Create Order Session (INR, Return URL)
    CF-->>Pay: Return cf_order_id & payment_session_id
    Pay->>Pay: Persist Payment record in DB (status: PENDING)
    Pay-->>Ord: Return payment_session_id & payment_mode (sandbox)
    
    Ord-->>GW: Return Order Details + payment_session_id
    GW-->>User: Order created, ready to process payment
    
    User->>CF: Mount Cashfree Checkout SDK & Complete payment
    Note over CF: User completes payment on Cashfree Sandbox Portal
    
    CF->>GW: POST /webhook/cashfree (Webhook payment event)
    GW->>Pay: Forward to /webhook/cashfree
    
    Pay->>Pay: Verify Cryptographic SHA256 HMAC Signature
    alt Signature Valid & Status is SUCCESS
        Pay->>Pay: Update Payment DB to SUCCESS
        Pay->>Ord: HTTP POST: notify_order_service (status: SUCCESS)
        Ord->>Ord: Update Order status in DB to "processing" / PAID
        Pay->>Cart: HTTP DELETE: /api/carts/user/{user_id} (Clear Cart)
        Cart->>Cart: Clear DB cart records & delete Redis cache
        Pay-->>CF: Response (200 OK)
    else Signature Invalid / Payment Failed
        Pay->>Pay: Update Payment DB to FAILED
        Pay->>Ord: HTTP POST: notify_order_service (status: FAILED)
        Ord->>Ord: Update Order status in DB to "cancelled"
    end
```

---

## ⚡ Features

### 🛒 Client & Storefront Features
* **🤖 Groq AI Shopping Assistant**: Integrated on the Homepage (`/`), allowing users to ask natural language product questions (e.g. *"suggest a mobile under 10000"* or *"best laptops for gaming"*).
* **🎯 Interactive RAG Product Recommendations**: Generates natural language responses alongside structured product cards displaying primary images, prices, brands, and category badges.
* **🔗 Direct Product Navigation**: Clicking any recommended product card in the AI chat instantly navigates to the Product Detail page (`/products/:id`).
* **⚠️ Out-of-Catalog Warning Notifications**: Automatically detects non-product or out-of-catalog questions and renders a warning banner (`⚠️ Out of Catalog Scope`).
* **Dynamic Catalog & Search**: Advanced product browsing, category filtering, and real-time availability checks.
* **Smart Shopping Cart**: Seamless cart additions, quantity modification checks, total item count calculation, and stock boundary checks.
* **Secure Payment & Checkout**: Seamless integration with **Cashfree Payment Gateway** supporting sandbox credit cards, simulated UPI, NetBanking, and instant transaction responses.
* **Detailed Ratings & Reviews**: User feedback with visual star ratings, average score calculation, and review history per product.
* **Responsive Fluid Design**: Fully responsive layout matching desktop, tablet, and mobile breakpoints using Tailwind CSS v4 and Shadcn UI.
* **Dynamic Theme Toggle**: System-wide dark/light mode transition with automatic theme persistence in localStorage.

### 🛡️ Administrative Controls
* **Admin Dashboard**: Comprehensive operations console including:
  * **🤖 RAG & AI Vector Dashboard (`/admin/rag`)**: Admin console to monitor vector embedding counts, inspect cosine similarity distances, and trigger full database RAG synchronization with batched vectorization.
  * **Product Management**: Create, read, update, and delete products (Full CRUD) with Cloudinary file uploads.
  * **Order Tracking**: Comprehensive view of created orders, customer details, and payment states.
  * **User Management**: Inspect registered user accounts, avatars, and user roles.

---

## 🤖 AI Recommendation Service & RAG Architecture

Buyzaar features a dedicated **Recommendation Microservice** built with **FastAPI**, **PostgreSQL + pgvector**, **LangChain**, **HuggingFace Embeddings**, **Inngest**, and **Groq LLM**.

```
┌─────────────────┐ 1. Ask question e.g. "Suggest mobile under 10000" ┌─────────────────────┐
│ Customer Client │ ────────────────────────────────────────────────> │ Nginx API Gateway   │
└─────────────────┘                                                   └─────────────────────┘
                                                                                 │
                                                                                 ▼
┌───────────────────────┐  2. Convert query to 384D vector (HuggingFace)  ┌─────────────────────┐
│ PostgreSQL + pgvector │ <────────────────────────────────────────── │ Recommendation Service
└───────────────────────┘                                             └─────────────────────┘
            │                                                                    │
            │ 3. Returns nearest cosine distance products                        │ 4. Filters price <= ₹10,000
            └────────────────────────────────────────────────────────────────────┘
                                                                                 │
                                                                                 ▼
┌─────────────────────┐   6. Returns Grounded Answer + Product Cards  ┌─────────────────────┐
│ Customer Client     │ <──────────────────────────────────────────── │ Groq LLM Generation │
└─────────────────────┘                                               └─────────────────────┘
```

### Key RAG Features:
1. **384-Dimensional HuggingFace Vector Embeddings**: Uses `sentence-transformers/all-MiniLM-L6-v2` to convert product titles, descriptions, categories, brands, and specifications into dense vector representations stored in PostgreSQL `product_embeddings`.
2. **Fast Vectorized Batch Sync**: Admin sync triggers `upsert_product_embeddings_batch()`, processing batch vectorization across all products in ~1-2 seconds.
3. **Budget & Constraint Filter Engine**: Extracted price limits (e.g., *"under 10000"*, *"below 50000"*) dynamically filter retrieved vector candidates so Groq AI strictly recommends products within the requested budget.
4. **Groq Model Fallback Cascade**: High-speed inference using `llama-3.1-8b-instant` with automatic fallback to `llama-3.3-70b-versatile` and `gemma2-9b-it`.
5. **Real-time Inngest Event Sync**: Automatically updates or deletes product vector embeddings when products are modified in the Product Service.

---

## 🛠️ Technology Stack

| Layer | Technologies & Frameworks | Description / Role |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite, React Router v7, Redux Toolkit, TanStack Query | Client application, global states, optimized routing, and component server-caching. |
| **UI Styling** | Tailwind CSS v4, Shadcn UI, Radix UI, Lucide Icons | Premium aesthetic layout, dark-mode toggle, responsive grids, and custom animations. |
| **API Gateway** | Nginx | Reverse proxy, CORS controller, security headers, routing endpoint mapping. |
| **Backend Services** | Python, FastAPI, SQLAlchemy, Alembic, Uvicorn | Asynchronous endpoint development, migrations, and automatic OpenAPI schema generation. |
| **AI & Vector DB** | PostgreSQL + pgvector, LangChain, HuggingFace (`all-MiniLM-L6-v2`), Groq LLM | Dense vector similarity indexing, budget filtering, and RAG product recommendation chat. |
| **Event Bus** | Inngest | Event-driven architecture for real-time vector embedding updates across microservices. |
| **Data Storage** | Neon Serverless PostgreSQL | Relational transactional storage optimized for cloud scale. |
| **Caching & Session** | Redis | Key-value store for product listings caching, RAG query caching, and cart speedups. |
| **Image Hosting** | Cloudinary | Asset distribution, profile avatars, and product catalog image processing. |
| **Payments** | Cashfree Sandbox SDK | E-Commerce payment session generation, webhook handling, and cryptographic verification. |
| **Orchestration** | Docker, Docker Compose | Service containerization and local infrastructure replication. |

---

## 📁 Project Directory Structure

```
ecommerce-microservices/
├── docker-compose.yml              # Orchestrates local container environments
├── README.md                       # Main project documentation (this file)
├── certs/                          # SSL Certificate configurations for Gateway HTTPS
├── client/                         # Vite + React + TypeScript Frontend
│   ├── Dockerfile                  # Container instructions for client development server
│   ├── package.json                # Frontend dependencies & packages
│   ├── src/
│   │   ├── api/                    # Axios & TanStack query hooks (productApi, ragApi)
│   │   ├── components/             # Reusable UI & AiChatSection components
│   │   ├── page/                   # Storefront pages & Admin RAG console (/admin/rag)
│   │   └── route/                  # React Router routes definition
│   └── tailwind.config.js          # Styling configurations
└── server/                         # Backend Services and Proxy
    ├── .env                        # Microservice configuration secrets (Neon DBs, Keys)
    ├── gateway/                    
    │   └── nginx.conf              # API Gateway upstream configurations
    ├── shared/                     # Shared Python utilities across services
    │   ├── cloudinary.py           # Cloudinary asset uploader
    │   ├── dependencies.py         # JWT and session authentication helper
    │   └── security.py             # Password hashing and token decoder wrappers
    └── services/                   # Microservice folder boundaries
        ├── user-service/           # User administration & auth endpoints
        ├── product-service/        # Inventory and Redis cache catalog operations
        ├── review-service/         # User feedbacks and reviews DB
        ├── cart-service/           # Active cart memory maps and Redis cache
        ├── order-service/          # Pricing validation, order creation logic
        ├── payment-service/        # Cashfree sessions, signature check, webhooks
        └── recommendation-service/ # FastAPI + pgvector + Groq AI + RAG recommendation engine
```

---

## 🧩 Service Breakdown & Detail

### 1. Nginx API Gateway
* **Port Mapping**: `80` (HTTP) / `443` (HTTPS)
* **Configuration**: `server/gateway/nginx.conf`
* **Role**: The single point of entry for all incoming traffic. Routes client requests based on path prefixes:
  - `/auth/*` ➔ `user-service:8000` (User registration, login, profile)
  - `/api/products/*` ➔ `product-service:8000` (Product list, details, creation)
  - `/api/carts/*` ➔ `cart-service:8000` (Cart updates, fetch cart, clear cart)
  - `/review/*` ➔ `review-service:8000` (Creating, editing, retrieving product reviews)
  - `/orders/*` ➔ `order-service:8000` (Order placement, callback, tracking)
  - `/payments/*` & `/webhook/cashfree` ➔ `payment-service:5000` (Checkout initialization and webhook)
  - `/api/rag/*` & `/api/chat` ➔ `recommendation-service:8000` (Vector search, batch sync, Groq AI chat)

### 2. User Service
* **Port**: `8000` (Internal)
* **Database**: Neon Postgres (`DATABASE_URL_USER_SERVICE`)
* **Role**: Manages user profiles, credentials, avatars, and roles (`USER` vs `ADMIN`). Encrypts passwords using BCrypt. Generates secure HS256 JWT tokens.

### 3. Product Service
* **Port**: `8000` (Internal)
* **Database**: Neon Postgres (`DATABASE_URL_PRODUCT_SERVICE`)
* **Caching**: Redis
* **Role**: Handles the product catalog, categorizations, inventories, and images. Uses Redis caching for featured listings. Publishes Inngest events (`product.created`, `product.updated`, `product.deleted`) to synchronize RAG embeddings automatically.

### 4. Cart Service
* **Port**: `8000` (Internal)
* **Database**: Neon Postgres (`DATABASE_URL_CART_SERVICE`)
* **Caching**: Redis
* **Role**: Manages active user baskets. Caches cart data (`cart:{user_id}`) in Redis for quick access. Communicates with Product Service via HTTP to merge real-time product prices and metadata.

### 5. Review Service
* **Port**: `8000` (Internal)
* **Database**: Neon Postgres (`DATABASE_URL_REVIEW_SERVICE`)
* **Caching**: Redis
* **Role**: Handles comments and rating submissions. Computes average star scores and breakdown counts. Clears review lists cache (`reviews:{product_id}:*`) and rating cache on updates.

### 6. Order Service
* **Port**: `8000` (Internal)
* **Database**: Neon Postgres (`DATABASE_URL_ORDER_SERVICE`)
* **Role**: Processes checkout requests. Performs price check verification with Product Service to prevent customer tampering, reserves inventory, creates pending orders, and triggers checkout generation by calling Payment Service.

### 7. Payment Service
* **Port**: `5000` (Internal)
* **Database**: Neon Postgres (`DATABASE_URL_PAYMENT_SERVICE`)
* **Role**: Handles Cashfree integration. Initiates sessions, captures payment histories, receives Cashfree webhook notifications, cryptographically verifies signatures using SHA256, notifies Order Service, and triggers Cart Service to empty purchased carts.

### 8. Recommendation Service
* **Port**: `8000` (Internal)
* **Database**: PostgreSQL + pgvector extension (`DATABASE_URL_RECOMMENDATION_SERVICE`)
* **Role**: Provides vector similarity search, Groq AI LLM product recommendation chat, budget constraint filtering, and Inngest background event processing.

---

## 🛡️ JWT Authentication & Authorization Flow

Buyzaar implements stateless token-based authorization via secure cookies.

```
[ Client ] --(1. Login/Register Form)--> [ Gateway ] --> [ User Service ]
[ Client ] <--(2. Sets Secure HttpOnly Cookie)-- [ Gateway ] <-- (JWT Token Created)
```

1. **Token Generation**: Upon successful login or registration, the **User Service** issues a JSON Web Token (JWT) containing the user's `email`, `role`, and `id` (as `sub` and payload keys).
2. **Secure Transport**: The token is returned in the response header setting a cookie named `access_token`. 
   - Cookie Parameters: `httponly=True`, `secure=True`, `samesite="none"`, `max_age=15 days`.
3. **Shared Authentication**: Protected backend endpoints do not need to query the User Service or its database to authenticate requests. Instead, they use a **Shared Dependency** (`server/shared/dependencies.py`):
   - Reads the cookie `access_token` (or fallback header `Authorization: Bearer <token>`).
   - Decodes the token using the shared `JWT_SECRET_KEY` via `jose` library.
   - Extracts identity schema (`TokenData` containing `email`, `role`, `user_id`).
   - Rejects with `HTTP 401 Unauthorized` if the token is invalid or expired.
4. **Role-Based Authorization**: Endpoints utilize `TokenData.role` to restrict administrator actions. For example, only `ADMIN` roles are permitted to trigger full RAG synchronization or manage inventory.

---

## 🚀 Getting Started

### Prerequisites
Ensure you have the following installed on your machine:
* **Docker & Docker Compose** (Highly recommended)
* **Node.js 18+** (For local frontend compilation)
* **Python 3.8+** (For local service debugging)

### 🐋 Option 1: Running with Docker Compose (Recommended)

To run the API Gateway, Redis caching, all 7 microservices, and the React frontend client in a unified container environment, execute the following command from the root directory:

```bash
docker-compose up -d --build
```

#### Access Endpoints
* **Frontend Web App**: [http://localhost:5173](http://localhost:5173)
* **API Gateway Entry**: [http://localhost](http://localhost)
* **Admin RAG Console**: [http://localhost:5173/admin/rag](http://localhost:5173/admin/rag)
* **Interactive API Docs (Swagger OpenAPI)**:
  - User Service Docs: `http://localhost/auth/docs`
  - Product Service Docs: `http://localhost/api/products/docs`
  - Cart Service Docs: `http://localhost/api/carts/docs`
  - Order Service Docs: `http://localhost/orders/docs`
  - Payment Service Docs: `http://localhost/payments/docs`
  - Review Service Docs: `http://localhost/review/docs`
  - Recommendation Service Docs: `http://localhost/api/recommendation/docs`

---

### 💻 Option 2: Running Services Locally (For Development)

If you are modifying individual services, running them locally without Docker provides fast hot-reloading.

#### 1. Setup Backend Environment Configuration
Create a `.env` file inside the `server/` directory following this template:

```env
# Neon Postgres Service Database Connections
DATABASE_URL_USER_SERVICE="postgresql://..."
DATABASE_URL_PRODUCT_SERVICE="postgresql://..."
DATABASE_URL_CART_SERVICE="postgresql://..."
DATABASE_URL_REVIEW_SERVICE="postgresql://..."
DATABASE_URL_ORDER_SERVICE="postgresql://..."
DATABASE_URL_PAYMENT_SERVICE="postgresql://..."
DATABASE_URL_RECOMMENDATION_SERVICE="postgresql://..."

# Groq AI & RAG Configuration
GROQ_API_KEY="your_groq_api_key"
GROQ_MODEL="llama-3.1-8b-instant"

# Security Secret
JWT_SECRET_KEY="your_secure_random_hash_key"

# Cloudinary Integration
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Service Host URLs (Development Fallbacks)
USER_SERVICE_URL=http://localhost:8000
PRODUCT_SERVICE_URL=http://localhost:8001
CART_SERVICE_URL=http://localhost:8002
REVIEW_SERVICE_URL=http://localhost:8003
ORDER_SERVICE_URL=http://localhost:8004
PAYMENT_SERVICE_URL=http://localhost:5000
RECOMMENDATION_SERVICE_URL=http://localhost:8003

# Cashfree Integrations
CASHFREE_APP_ID="your_cashfree_sandbox_app_id"
CASHFREE_SECRET_KEY="your_cashfree_sandbox_secret_key"
CASHFREE_BASE_URL="https://sandbox.cashfree.com/pg"
CASHFREE_API_VERSION="2023-08-01"
```

#### 2. Run Recommendation Microservice
```bash
cd server/services/recommendation-service
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload
```

#### 3. Run Database Migrations
```bash
cd server/services/recommendation-service
source .venv/bin/activate
alembic upgrade head
```

#### 4. Run the Client Web App
Install frontend dependencies and start Vite:

```bash
cd client
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
