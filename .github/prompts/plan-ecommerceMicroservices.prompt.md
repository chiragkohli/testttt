# E-Commerce Microservices Backend Implementation Plan

## Overview
**TL;DR:** Build a production-grade e-commerce backend using Node.js (Express + TypeScript) with 4 independent microservices (User, Product, Search, API Gateway), PostgreSQL + MongoDB + Elasticsearch, Kafka event streaming, and Docker Compose orchestration. Phase 1 implements core features with basic logging; Phase 2 adds full observability.

**Key Decisions:**
- **Technology:** Node.js + Express + TypeScript (lightweight, I/O-optimized, full control)
- **Message Broker:** Kafka (event streaming, high throughput)
- **Authentication:** JWT + bcrypt + User/Admin RBAC
- **Deployment:** Docker Compose for local dev, ready for Kubernetes
- **Observability Phased:** Core logging in Phase 1, full Prometheus/Grafana/Jaeger in Phase 2
- **Testing:** Unit + integration tests with Jest + Supertest

---

## Phase 1: Core Microservices & Event-Driven Architecture

### Step 1: Project Structure & Setup
Creates root directory with shared configurations and service scaffolding.

**Folder Structure:**
```
backend/
├── docker-compose.yml
├── .env.example
├── shared/
│   ├── types/
│   │   ├── models.ts         # Shared interfaces (User, Product, Event)
│   │   └── enums.ts          # Shared enums (UserRole, OrderStatus)
│   ├── middleware/
│   │   ├── errorHandler.ts   # Global error handling
│   │   └── logging.ts        # Winston logger setup
│   └── utils/
│       ├── validation.ts     # Input validation (joi schemas)
│       └── jwt.ts            # JWT sign/verify utilities
│
├── services/
│   ├── api-gateway/
│   ├── user-service/
│   ├── product-service/
│   └── search-service/
│
├── infra/
│   └── kafka/
│       └── send-event.ts     # Kafka producer helper
```

**Deliverables:**
- Root `docker-compose.yml` with all services + infrastructure
- Root `.env.example` with all required variables
- Shared types, middleware, utils library for cross-service use
- Package structure ready for service-specific extensions

---

### Step 2: API Gateway (Entry Point)
Implements request routing, authentication validation, and rate limiting.

**Technology:**
- Express + TypeScript
- `express-rate-limit` for rate limiting
- JWT validation middleware
- Morgan for HTTP request logging

**Key Features:**
- Route requests to User, Product, Search services
- Validate JWT on protected routes
- Rate limiting (100 requests/15 minutes per IP)
- Request ID injection for tracing
- Error response standardization

**Routes:**
```
/api/users/*         → User Service
/api/products/*      → Product Service  
/api/search/*        → Search Service
/health              → Gateway health check
```

**Folder Structure:**
```
api-gateway/
├── src/
│   ├── app.ts                    # Express app initialization
│   ├── server.ts                 # Server startup
│   ├── config/
│   │   ├── routes.ts             # Route definitions
│   │   └── environment.ts        # Env variable validation
│   ├── middleware/
│   │   ├── auth.ts               # JWT validation
│   │   ├── rateLimit.ts          # Rate limiting config
│   │   └── proxy.ts              # Service proxying
│   └── controllers/
│       └── gateway.controller.ts # Health check, routing
├── .env
├── Dockerfile
├── package.json
└── tsconfig.json
```

**Deliverables:**
- API Gateway service with request routing
- Rate limiting & auth validation middleware
- Dockerfile for containerization
- Environment configuration setup

---

### Step 3: User Service (Authentication & User Management)
Handles registration, login, profile management, and JWT issuance.

**Database:** PostgreSQL

**Schema:**
```sql
users (
  id: UUID PRIMARY KEY,
  email: VARCHAR UNIQUE NOT NULL,
  username: VARCHAR UNIQUE NOT NULL,
  password_hash: VARCHAR NOT NULL,
  first_name: VARCHAR,
  last_name: VARCHAR,
  role: ENUM('USER', 'ADMIN') DEFAULT 'USER',
  is_active: BOOLEAN DEFAULT TRUE,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

refresh_tokens (
  id: UUID PRIMARY KEY,
  user_id: UUID FOREIGN KEY,
  token: TEXT NOT NULL,
  expires_at: TIMESTAMP,
  created_at: TIMESTAMP
)
```

**Folder Structure:**
```
user-service/
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── config/
│   │   ├── database.ts           # PostgreSQL connection
│   │   ├── environment.ts        # Validation
│   │   └── jwt.ts                # JWT config
│   ├── controllers/
│   │   └── auth.controller.ts    # Signup, login, profile
│   ├── services/
│   │   └── auth.service.ts       # Business logic
│   ├── repositories/
│   │   └── user.repository.ts    # Database queries
│   ├── models/
│   │   └── user.model.ts         # TypeORM entities
│   ├── middleware/
│   │   ├── auth.ts               # JWT verification
│   │   └── validation.ts         # Input validation (joi)
│   ├── types/
│   │   └── index.ts              # Local interfaces
│   └── migrations/
│       └── 001-create-users.sql
├── .env
├── Dockerfile
├── docker-compose.test.yml       # For local DB testing
├── package.json
└── tsconfig.json
```

**API Endpoints:**
```
POST   /api/users/signup           # Register new user
POST   /api/users/login            # Issue JWT token
GET    /api/users/profile          # Get current user (requires JWT)
PUT    /api/users/profile          # Update profile (requires JWT)
POST   /api/users/logout           # Invalidate refresh token
POST   /api/users/refresh-token    # Get new access token
```

**Key Libraries:**
- `typeorm` + `pg` for PostgreSQL ORM
- `bcrypt` for password hashing
- `jsonwebtoken` for JWT
- `joi` for input validation
- `uuid` for ID generation

**Deliverables:**
- User Service with auth controllers, services, repositories
- PostgreSQL schema and migrations
- JWT + bcrypt implementation
- Input validation middleware
- Dockerfile for containerization

---

### Step 4: Product Service (Catalog Management)
Manages product CRUD, categories, inventory, and publishes events to Kafka.

**Database:** MongoDB

**Schema:**
```javascript
products {
  _id: ObjectId,
  sku: String UNIQUE,
  name: String REQUIRED,
  description: String,
  category: String,
  price: Number REQUIRED,
  discount_percentage: Number DEFAULT 0,
  final_price: Number,  // Denormalized
  stock_quantity: Number,
  images: [String],     // URLs
  attributes: {         // Flexible schema for category-specific data
    size: String,
    color: String,
    material: String    // Only clothing has these
  },
  ratings: {
    average: Number,
    count: Number
  },
  is_active: Boolean DEFAULT TRUE,
  created_at: Date,
  updated_at: Date
}
```

**Folder Structure:**
```
product-service/
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── config/
│   │   ├── database.ts           # MongoDB connection
│   │   ├── environment.ts        # Validation
│   │   └── kafka.ts              # Kafka producer config
│   ├── controllers/
│   │   └── product.controller.ts # CRUD operations
│   ├── services/
│   │   └── product.service.ts    # Business logic, event publishing
│   ├── repositories/
│   │   └── product.repository.ts # MongoDB queries
│   ├── models/
│   │   └── product.model.ts      # Mongoose schemas
│   ├── middleware/
│   │   ├── auth.ts               # Role-based (ADMIN check)
│   │   └── validation.ts         # Input validation
│   ├── events/
│   │   ├── productCreated.ts     # Event structure
│   │   ├── productUpdated.ts     # Event structure
│   │   └── productDeleted.ts     # Event structure
│   └── types/
│       └── index.ts
├── .env
├── Dockerfile
├── package.json
└── tsconfig.json
```

**API Endpoints:**
```
POST   /api/products                    # Create (admin only)
GET    /api/products                    # List with pagination/filtering
GET    /api/products/{id}               # Get product details
PUT    /api/products/{id}               # Update (admin only)
DELETE /api/products/{id}               # Delete (admin only)
GET    /api/products/category/{cat}     # Filter by category
```

**Kafka Events Published:**
```
Topic: product-events
- product.created   → { id, sku, name, category, price, ... }
- product.updated   → { id, updated_fields, ... }
- product.deleted   → { id }
```

**Key Libraries:**
- `mongoose` + `mongodb` for MongoDB ODM
- `kafkajs` for Kafka producer
- `joi` for validation

**Deliverables:**
- Product Service with full CRUD, filtering, pagination
- MongoDB schema with flexible attributes
- Kafka producer setup for event publishing
- Admin-only authorization middleware
- Dockerfile

---

### Step 5: Search Service (Elasticsearch Integration)
Consumes product events from Kafka and maintains Elasticsearch index for full-text search.

**Technology:** Elasticsearch, Kafka Consumer

**Index Mapping:**
```json
{
  "properties": {
    "product_id": { "type": "keyword" },
    "sku": { "type": "keyword" },
    "name": { "type": "text", "analyzer": "standard" },
    "description": { "type": "text" },
    "category": { "type": "keyword" },
    "price": { "type": "float" },
    "discount_percentage": { "type": "float" },
    "final_price": { "type": "float" },
    "stock_quantity": { "type": "integer" },
    "attributes": { "type": "object", "enabled": false },
    "rating_average": { "type": "float" },
    "is_active": { "type": "boolean" },
    "created_at": { "type": "date" }
  }
}
```

**Folder Structure:**
```
search-service/
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── config/
│   │   ├── elasticsearch.ts      # ES client setup, index init
│   │   ├── kafka.ts              # Kafka consumer config
│   │   └── environment.ts        # Validation
│   ├── controllers/
│   │   └── search.controller.ts  # Search endpoint
│   ├── services/
│   │   ├── search.service.ts     # Query building, Elasticsearch calls
│   │   └── indexing.service.ts   # Index management
│   ├── consumers/
│   │   └── productEventConsumer.ts # Kafka consumer
│   ├── middleware/
│   │   └── validation.ts         # Query parameter validation
│   ├── types/
│   │   └── index.ts              # Search response structures
│   └── utils/
│       └── elasticsearch.ts       # ES helper functions
├── .env
├── Dockerfile
├── package.json
└── tsconfig.json
```

**API Endpoints:**
```
GET /api/search?q=shirt&category=clothing&min_price=100&max_price=500
  → Returns ranked results from Elasticsearch

GET /api/search/autocomplete?prefix=shi
  → Autocomplete suggestions

GET /api/search/filters
  → Available filters and categories
```

**Kafka Consumer:**
```
Subscribes to: product-events
- product.created/updated → Index in Elasticsearch
- product.deleted → Remove from index
Handles failures with retry logic + dead letter queue
```

**Key Libraries:**
- `@elastic/elasticsearch` for ES client
- `kafkajs` for Kafka consumer
- `joi` for query validation

**Deliverables:**
- Search Service with full-text search, autocomplete, filtering
- Elasticsearch index mapping and initialization
- Kafka consumer for event-driven indexing
- Retry logic and error handling
- Dockerfile

---

### Step 6: Docker Compose & Infrastructure
Orchestrates all services, databases, and message broker locally.

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  # Databases
  postgres:
    image: postgres:15-alpine
    env_file: .env.postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./services/user-service/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $POSTGRES_USER"]
      interval: 10s
      timeout: 5s
      retries: 5

  mongodb:
    image: mongo:6-alpine
    env_file: .env.mongodb
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    volumes:
      - kafka_data:/var/lib/kafka/data
    ports:
      - "9092:9092"
    healthcheck:
      test: ["CMD-SHELL", "kafka-broker-api-versions.sh --bootstrap-server localhost:9092"]
      interval: 10s
      timeout: 5s
      retries: 5

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports:
      - "2181:2181"
    healthcheck:
      test: ["CMD-SHELL", "echo ruok | nc localhost 2181"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Microservices
  api-gateway:
    build: ./services/api-gateway
    ports:
      - "3000:3000"
    env_file: .env.api-gateway
    depends_on:
      - user-service
      - product-service
      - search-service
      postgres:
        condition: service_healthy
      mongodb:
        condition: service_healthy
      elasticsearch:
        condition: service_healthy
      kafka:
        condition: service_healthy

  user-service:
    build: ./services/user-service
    ports:
      - "3001:3001"
    env_file: .env.user-service
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
    volumes:
      - ./services/user-service/src:/app/src

  product-service:
    build: ./services/product-service
    ports:
      - "3002:3002"
    env_file: .env.product-service
    depends_on:
      mongodb:
        condition: service_healthy
      kafka:
        condition: service_healthy
    environment:
      MONGO_URI: mongodb://mongodb:27017/ecommerce_products
      KAFKA_BROKER: kafka:9092
    volumes:
      - ./services/product-service/src:/app/src

  search-service:
    build: ./services/search-service
    ports:
      - "3003:3003"
    env_file: .env.search-service
    depends_on:
      elasticsearch:
        condition: service_healthy
      kafka:
        condition: service_healthy
    environment:
      ELASTICSEARCH_URL: http://elasticsearch:9200
      KAFKA_BROKER: kafka:9092
    volumes:
      - ./services/search-service/src:/app/src

volumes:
  postgres_data:
  mongodb_data:
  elasticsearch_data:
  kafka_data:
```

**Environment Files (.env files for each service):**

`.env.postgres` - PostgreSQL credentials
`.env.mongodb` - MongoDB credentials
`.env.api-gateway` - Gateway config (service URLs, rate limit)
`.env.user-service` - JWT secret, DB creds
`.env.product-service` - DB creds, Kafka broker
`.env.search-service` - ES URL, Kafka broker

**Deliverables:**
- Root `docker-compose.yml` with all services
- Individual `.env` files for local development
- Health checks for all services
- Volume mounting for data persistence
- Service dependencies configured

---

### Step 7: Kafka Event-Driven Setup
Establishes Kafka topics and event structure for eventual consistency.

**Kafka Setup:**
```
Topics to Create (auto-created via producer):
- product-events (partitions: 3, replication-factor: 1)

Message Format:
{
  "event_id": "uuid",
  "event_type": "product.created|product.updated|product.deleted",
  "aggregate_id": "product-id",
  "aggregate_type": "Product",
  "timestamp": "iso-8601",
  "version": 1,
  "payload": { ... product data ... }
}
```

**Consumer Groups:**
```
search-service → search-index-consumer
  Subscribes to: product-events
  Processes: Updates Elasticsearch index
  Dead Letter Strategy: Log + store in DLQ topic
```

**Deliverables:**
- Kafka producer setup in Product Service
- Kafka consumer setup in Search Service
- Error handling & retry logic
- Dead letter queue for failed events

---

### Step 8: Logging Setup (Phase 1 - Core Logging)
Implements basic logging across all services with Winston.

**Shared Logging Middleware:**
```
Winston Configuration:
- Console transport (dev)
- File transport (production) 
- Log levels: error, warn, info, debug
- Request logging: HTTP method, path, status, response time
- Service name injection: Identify logs by service
```

**Deliverables:**
- Winston logger utility in shared/middleware
- Http request logging middleware (Morgan alternative)
- Error logging with stack traces
- Service identifier in all logs

---

### Step 9: Testing Setup (Unit & Integration Tests)
Establishes test framework and basic test coverage.

**Testing Strategy:**
```
Framework: Jest + Supertest
Coverage Target: 70%+ for Phase 1

User Service Tests:
- Unit: auth.service (JWT, bcrypt logic)
- Integration: auth.controller (with real PostgreSQL in test container)
- API: Signup, login, profile endpoints

Product Service Tests:
- Unit: product.service (business logic)
- Integration: product.controller (with MongoDB)
- API: CRUD operations, filtering, pagination

Search Service Tests:
- Unit: search.service (query building)
- Integration: Search with Elasticsearch

Test Setup:
- docker-compose.test.yml for test databases
- Jest config with TypeScript support
- Supertest for HTTP assertions
```

**Deliverables:**
- Jest configuration for each service
- Sample test files (auth, product CRUD, search)
- Test database setup
- CI/CD ready test scripts

---

## Phase 2: Observability & Advanced Features (Deferred)

### Observability Stack (Post-Phase 1)
- **Metrics:** Prometheus scraping service endpoints
- **Visualization:** Grafana dashboards (latency, throughput, error rates)
- **Distributed Tracing:** OpenTelemetry + Jaeger (trace requests across services)
- **Health Checks:** Actuator endpoints for each service

### Additional Features (Post-Phase 1)
- API versioning (/api/v1/, /api/v2/)
- Caching layer (Redis) for product listings & search results
- Rate limiting per-user (authenticated endpoints)
- Audit logging for admin operations
- Order Service (payment integration)
- Inventory management with reservations

---

## Implementation Steps (Execution Order)

### Can Run in Parallel:
1. **Step 1** - Project structure (foundational)
2. **Step 6** - Docker Compose setup (uses Step 1)

### Dependency Chain:
3. **Step 3** - User Service (requires Step 1 & 6)
4. **Step 4** - Product Service (requires Step 1, 6, & Kafka in Step 6)
5. **Step 5** - Search Service (requires Step 4, Kafka, ES)
6. **Step 2** - API Gateway (requires User, Product, Search services)

### Parallel with Services:
7. **Step 7** - Kafka events (while building services)
8. **Step 8** - Logging (integrate into each service)
9. **Step 9** - Testing (write tests as services complete)

---

## Critical Files & Patterns

**Authentication Pattern (reused across services):**
- shared/utils/jwt.ts - JWT sign/verify
- shared/middleware/auth.ts - Auth middleware
- Repository: user-service/src/repositories/user.repository.ts

**Kafka Event Publishing Pattern:**
- infra/kafka/send-event.ts - Reusable producer
- Implementation: product-service/src/services/product.service.ts

**Database Access Pattern:**
- User Service: TypeORM repository pattern
- Product Service: Mongoose schema + custom repository
- Ensure zero coupling: repositories are service-specific

**Error Handling Pattern:**
- shared/middleware/errorHandler.ts - Global handler
- Consistent response format: `{ status, message, data?, errors? }`

**Input Validation Pattern:**
- shared/utils/validation.ts - Joi schemas
- Middleware integration in each controller

**Event Payload Structure:**
- infra/kafka/schemas - Event TypeScript definitions
- All events follow: `{ event_id, event_type, aggregate_id, timestamp, payload }`

---

## Verification Steps

### After Each Service:
1. **Startup Test:** Service starts without errors
   - Command: `docker-compose up <service-name>`
   - Verify: Service logs show "listening on port XXXX"

2. **Health Check API:**
   - Command: `curl http://localhost:3XXX/health`
   - Response: `{ "status": "ok" }`

3. **Database Connection:**
   - Service logs contain connection success message
   - Database is accessible from service

### After Gateway + Services Integration:
4. **Full Stack Test:**
   ```bash
   docker-compose up
   # Wait for all health checks to pass
   curl http://localhost:3000/api/users/health
   curl http://localhost:3000/api/products/health
   curl http://localhost:3000/api/search/health
   ```

5. **Authentication Flow:**
   - Signup user via gateway → 201 created
   - Login via gateway → Receive JWT token
   - Access protected endpoint with JWT → 200 ok
   - Access without JWT → 401 unauthorized

6. **Event-Driven Flow:**
   - Create product via Product Service
   - Verify Kafka event published (check logs)
   - Search Service consumes event
   - Product appears in Elasticsearch search results

7. **API Documentation:**
   - Swagger docs accessible
   - All endpoints documented with request/response examples

### Testing Verification:
8. **Test Execution:**
   ```bash
   npm run test              # Run all tests
   npm run test:coverage     # Generate coverage reports
   ```
   - Minimum 70% coverage for Phase 1
   - All integration tests pass with services running

### Performance Verification:
9. **Response Time:**
   - Signup: <300ms
   - Product list: <500ms (with filters)
   - Search: <200ms (with pagination)
   - Login: <200ms

10. **Load Capacity:**
    - Gateway handles 100 concurrent requests without errors
    - Kafka processes 1000 events/sec without lag

---

## Folder Structure Summary

```
backend/
├── README.md                          # Setup instructions
├── docker-compose.yml                 # Service orchestration
├── .env.example                       # Template for all env vars
│
├── shared/
│   ├── types/
│   │   ├── models.ts                  # Interfaces: User, Product, Event
│   │   └── enums.ts                   # Enums: UserRole, etc
│   ├── middleware/
│   │   ├── errorHandler.ts            # Global error handling
│   │   ├── logging.ts                 # Winston logger config
│   │   └── auth.ts                    # JWT validation middleware
│   └── utils/
│       ├── validation.ts              # Joi schema builders
│       └── jwt.ts                     # JWT utilities
│
├── services/
│   ├── api-gateway/
│   │   ├── src/
│   │   │   ├── app.ts
│   │   │   ├── server.ts
│   │   │   ├── config/
│   │   │   ├── middleware/
│   │   │   └── controllers/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── user-service/
│   │   ├── src/
│   │   │   ├── app.ts
│   │   │   ├── server.ts
│   │   │   ├── config/
│   │   │   │   ├── database.ts        # TypeORM config
│   │   │   │   ├── jwt.ts
│   │   │   │   └── environment.ts
│   │   │   ├── controllers/
│   │   │   │   └── auth.controller.ts
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts
│   │   │   ├── repositories/
│   │   │   │   └── user.repository.ts
│   │   │   ├── models/
│   │   │   │   └── user.model.ts      # TypeORM entity
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   └── validation.ts
│   │   │   ├── migrations/
│   │   │   │   └── 001-create-users.sql
│   │   │   └── tests/
│   │   │       ├── auth.service.spec.ts
│   │   │       └── auth.controller.spec.ts
│   │   ├── .env
│   │   ├── Dockerfile
│   │   ├── jest.config.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── product-service/
│   │   ├── src/
│   │   │   ├── app.ts
│   │   │   ├── server.ts
│   │   │   ├── config/
│   │   │   │   ├── database.ts        # Mongoose config
│   │   │   │   ├── kafka.ts
│   │   │   │   └── environment.ts
│   │   │   ├── controllers/
│   │   │   │   └── product.controller.ts
│   │   │   ├── services/
│   │   │   │   └── product.service.ts
│   │   │   ├── repositories/
│   │   │   │   └── product.repository.ts
│   │   │   ├── models/
│   │   │   │   └── product.model.ts   # Mongoose schema
│   │   │   ├── events/
│   │   │   │   ├── productCreated.ts
│   │   │   │   ├── productUpdated.ts
│   │   │   │   └── productDeleted.ts
│   │   │   ├── middleware/
│   │   │   ├── tests/
│   │   │   └── types/
│   │   ├── .env
│   │   ├── Dockerfile
│   │   ├── jest.config.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── search-service/
│       ├── src/
│       │   ├── app.ts
│       │   ├── server.ts
│       │   ├── config/
│       │   │   ├── elasticsearch.ts
│       │   │   ├── kafka.ts
│       │   │   └── environment.ts
│       │   ├── controllers/
│       │   │   └── search.controller.ts
│       │   ├── services/
│       │   │   ├── search.service.ts
│       │   │   └── indexing.service.ts
│       │   ├── consumers/
│       │   │   └── productEventConsumer.ts
│       │   ├── middleware/
│       │   ├── tests/
│       │   └── types/
│       ├── .env
│       ├── Dockerfile
│       ├── jest.config.js
│       ├── package.json
│       └── tsconfig.json
│
└── infra/
    └── kafka/
        └── send-event.ts              # Kafka producer helper
```

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Express + TypeScript** | Lightweight, high I/O throughput, strong typing, large ecosystem for microservices |
| **Database Per Service** | Independent scaling, technology choice per service, loose coupling |
| **Kafka for Events** | High-throughput event streaming, partitioning for scaling, offset management, fault tolerance |
| **Elasticsearch** | Full-text search, fast filtering, aggregations, relevance ranking |
| **MongoDB (Product)** | Schema flexibility for product attributes across categories, horizontal scaling |
| **PostgreSQL (User)** | ACID transactions, relational integrity for auth |
| **JWT for Auth** | Stateless, distributed authentication, no session storage |
| **Docker Compose** | Local dev simplicity, path to Kubernetes deployment |
| **Phased Observability** | Core logging now, advanced metrics/tracing later (Phase 2) |

---

## Commands & Operations

### Local Setup
```bash
# Copy env template
cp .env.example .env.example

# Start all services
docker-compose up

# Rebuild specific service
docker-compose up --build user-service

# View logs
docker-compose logs -f user-service
docker-compose logs -f product-service
```

### Database Operations
```bash
# PostgreSQL migrations (auto-run on container start)
# For manual migration:
docker exec ecommerce-postgres psql -U postgres -d users < migrations.sql

# MongoDB seed data
docker exec ecommerce-mongodb mongosh < seed-products.js
```

### Testing
```bash
cd services/user-service && npm run test
cd services/product-service && npm run test
cd services/search-service && npm run test
```

### API Testing
```bash
# User signup
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","email":"john@example.com","password":"secure123"}'

# Product create (admin only)
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"sku":"SHIRT-001","name":"Blue Shirt","price":599,"category":"clothing"}'

# Search products
curl "http://localhost:3000/api/search?q=shirt&category=clothing&min_price=100&max_price=1000"
```

---

## Success Criteria (Phase 1)

- [ ] All 4 services start without errors via `docker-compose up`
- [ ] All health check endpoints respond with 200 OK
- [ ] User signup/login flow works end-to-end
- [ ] Products can be created and appear in search results within 5 seconds
- [ ] Rate limiting blocks requests after 100/15min
- [ ] Database migrations run automatically on startup
- [ ] All tests pass with 70%+ coverage
- [ ] Swagger docs available for all endpoints
- [ ] Kafka events published and consumed without errors
- [ ] Response times meet targets (signup <300ms, search <200ms)

---

## Timeline Estimate

| Phase | Task | Duration |
|-------|------|----------|
| **Phase 1** | Shared types + Docker setup | 2 hours |
| | User Service | 4 hours |
| | Product Service | 4 hours |
| | Search Service | 3 hours |
| | API Gateway | 2 hours |
| | Logging + Testing | 3 hours |
| | Integration testing | 2 hours |
| | **Phase 1 Total** | **~20 hours** |
| **Phase 2** | Prometheus + Grafana | 4 hours |
| | OpenTelemetry + Jaeger | 4 hours |
| | Advanced features | Ongoing |

