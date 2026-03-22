# Architecture & Design Document

## System Architecture

### Overview

This is a cloud-native, event-driven microservices architecture for an e-commerce platform selling clothing products. The system is designed to scale horizontally, handle eventual consistency, and maintain loose coupling between services.

### Core Principles

1. **Microservices Pattern**: Each service owns its business logic, data, and API
2. **Database per Service**: No shared databases; prevents tight coupling
3. **Event-Driven Communication**: Kafka for async communication (Eventual Consistency)
4. **API Gateway Pattern**: Single entry point for all clients; routes to services
5. **Stateless Services**: All service instances are interchangeable; scales easily
6. **Circuit Breaker Ready**: Services can fail independently; graceful degradation

---

## Service Responsibilities

### API Gateway
- **Port**: 3000
- **Responsibilities**:
  - Route HTTP requests to microservices
  - Validate JWT tokens on protected routes
  - Implement rate limiting per-user
  - Standardize error responses
  - Inject request IDs for distributed tracing
  - Load balancing (via http-proxy-middleware)
- **Technology**: Express + http-proxy-middleware
- **Deployment**: Stateless (scale horizontally)

### User Service
- **Port**: 3001
- **Database**: PostgreSQL (relational, strong consistency)
- **Responsibilities**:
  - Handle user registration (email validation, password hashing)
  - Authenticate users (email/password → JWT)
  - Issue and validate JWT tokens
  - Manage refresh tokens
  - Profile management
  - Role-based access control (USER, ADMIN)
- **Technology**: Express + TypeORM + PostgreSQL
- **Data Model**:
  - `users` table: Core user information
  - `refresh_tokens` table: Token invalidation on logout
- **Scaling**: Horizontal (stateless) + Database replication

### Product Service
- **Port**: 3002
- **Database**: MongoDB (flexible schema)
- **Responsibilities**:
  - Product CRUD operations
  - Product catalog management
  - Inventory tracking
  - Filtering and pagination
  - Publishing product events to Kafka
  - Category management
- **Technology**: Express + Mongoose + MongoDB
- **Data Model**:
  - `products` collection with flexible `attributes` object
  - Examples: clothing products can have size, color, material
- **Event Publishing**:
  - `product.created` → Kafka topic `product-events`
  - `product.updated` → Kafka topic `product-events`
  - `product.deleted` → Kafka topic `product-events`
- **Scaling**: Horizontal (stateless) + MongoDB sharding

### Search Service
- **Port**: 3003
- **Database**: Elasticsearch (search indices, no primary storage)
- **Responsibilities**:
  - Full-text search across product data
  - Autocomplete suggestions
  - Filtering by category, price range
  - Real-time index updates via Kafka consumer
  - Aggregation (available categories, price statistics)
- **Technology**: Express + @elastic/elasticsearch + Kafka Consumer
- **Data Flow**:
  1. Product Service publishes event to Kafka
  2. Search Service consumes event
  3. Updates Elasticsearch index in real-time
  4. Search queries fetch from Elasticsearch, not MongoDB
- **Scaling**: Horizontal (stateless) + Elasticsearch clustering

---

## Data Flow Scenarios

### Scenario 1: User Registration

```
Client
  ↓ POST /api/users/signup
API Gateway
  ↓ route to /signup
User Service
  ↓
1. Validate input (Joi schema)
2. Check email uniqueness (query PostgreSQL)
3. Hash password (bcrypt, 10 rounds)
4. Insert user record (TypeORM)
5. Issue JWT token (jsonwebtoken)
6. Return user + tokens
  ↓
Response (201 Created)
Client
```

**Database**: PostgreSQL INSERT → ACID transaction

---

### Scenario 2: Admin Creates Product

```
Client (with Admin JWT)
  ↓ POST /api/products
API Gateway
  ↓ validate JWT (requireAdmin middleware)
Product Service
  ↓
1. Validate input (category, price, SKU)
2. Check SKU uniqueness (MongoDB query)
3. Calculate finalPrice = price - (price * discount / 100)
4. Insert product (MongoDB save)
5. Publish event to Kafka
  ↓ product.created event
Kafka Broker
  ↓ route to partition
Consumer (Search Service running)
  ↓
1. Receive product.created event
2. Index product in Elasticsearch
3. Acknowledge consumption
  ↓
Response (201 Created)
Client

[~5 seconds later]
GET /api/search?q=product-name
  ↓ (searches Elasticsearch)
Product visible in search results
```

**Consistency Model**: Eventual (product in MongoDB immediately, search index updated within 5 seconds)

---

### Scenario 3: User Searches for Products

```
Client
  ↓ GET /api/search?q=shirt&minPrice=500&maxPrice=1000
API Gateway
  ↓
Search Service
  ↓
1. Build Elasticsearch query
   - Multi-match search on name, description
   - Range filter on finalPrice
   - Term filter on isActive=true
2. Execute search
3. Return ranked results (relevance scoring)
  ↓
Response (200 OK)
Client displays 20 results + pagination info
```

**Performance**: Sub-200ms (Elasticsearch advantage over MongoDB full scans)

---

### Scenario 4: Data Consistency Across Services

**Product updated: Admin changes price from 599 → 699**

```
Time 0s:
  User sends: PUT /api/products/id { price: 699 }
  Product Service updates MongoDB
  Product Service publishes product.updated event
  Response sent to user (200 OK)

Time 0-1s:
  Kafka delivers event to Search Service (replication)

Time 1-3s:
  Search Service processes event
  Elasticsearch index updated

Time 5s:
  Search results reflect new price
```

**What if Network Fails?**

1. Kafka has 3 replicas (configured in docker-compose)
2. Search Service resumes from last offset on reconnect
3. Dead Letter Queue (DLQ) for permanently failed events
4. Admin can manually trigger product reindex if needed

---

## Authentication & Authorization

### JWT Token Structure

```typescript
// Access Token (15 minutes)
{
  userId: string
  username: string
  email: string
  role: 'USER' | 'ADMIN'
  iat: number (issued at)
  exp: number (expiration)
}

// Refresh Token (7 days)
{
  userId: string
}
```

### Token Flow

```
1. User logs in
   POST /api/users/login
   ↓
   Return accessToken (15m) + refreshToken (7d)

2. Access protected endpoint
   GET /api/users/profile
   Header: Authorization: Bearer accessToken
   ↓
   API Gateway validates JWT
   ↓
   Request proceeds with req.user populated

3. Access token expires (after 15m)
   User has refreshToken stored (HTTP-only cookie in production)
   ↓
   POST /api/users/refresh-token
   Send refreshToken
   ↓
   Return new accessToken (15m)
   ↓
   Continue using API

4. User logs out
   POST /api/users/logout
   ↓
   Invalidate refreshToken (remove from DB)
   ↓
   User must log in again
```

### Admin Operations

Only users with role=ADMIN can:
- Create products: `POST /api/products`
- Update products: `PUT /api/products/:id`
- Delete products: `DELETE /api/products/:id`

Controlled via `requireAdmin` middleware:
```typescript
app.post('/products', authenticateToken, requireAdmin, productController.create);
```

---

## Error Handling

### Global Error Handler

All errors are caught by the async handler wrapper and passed to the global error handler middleware:

```typescript
try {
  // endpoint logic
} catch (error) {
  // asyncHandler catches and passes to middleware
  next(error);
  // middleware logs and returns standardized JSON response
}
```

### Error Response Format

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation Error",
  "errors": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  }
}
```

### Error Classes (in shared/types/index.ts)

- `ValidationError` (400)
- `AuthenticationError` (401)
- `AuthorizationError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `AppError` (generic, parent of above)

---

## Scaling Strategy

### Horizontal Scaling

```
Load Balancer
  ↓
[Gateway1] [Gateway2] [Gateway3]
  ↓          ↓          ↓
[User1] [User2] [User3]
[Product1] [Product2] [Product3]
[Search1] [Search2] [Search3]
  ↓          ↓          ↓
PostgreSQL (with replication)
MongoDB (with sharding)
Elasticsearch (with clustering)
Kafka (with multiple brokers)
```

### Bottlenecks & Solutions

| Component | Bottleneck | Solution |
|-----------|-----------|----------|
| API Gateway | CPU (request processing) | Add replicas; use reverse proxy |
| User Service | Database connections | Connection pooling; read replicas |
| Product Service | MongoDB throughput | Sharding by category/region |
| Search Service | Elasticsearch throughput | Add nodes; optimize queries |
| Kafka | Message throughput | Increase partitions; add brokers |

### Database Scaling

**PostgreSQL (User Service)**:
- Read replicas for scaling reads
- Connection pooling (PgBouncer)
- Vertical scaling for writes

**MongoDB (Product Service)**:
- Sharding by range (e.g., by category)
- Read preference: secondary for non-critical reads
- Indexing strategy on SKU, category, isActive

**Elasticsearch (Search Service)**:
- Multiple nodes in cluster
- Index sharding and replication
- Shard allocation awareness

---

## Resilience & Fault Tolerance

### Service Failures

**If User Service is down**:
- Login/signup fails
- Profile endpoints return 503 (via gateway proxy error handler)
- Product Service unaffected
- Search Service unaffected

**If Product Service is down**:
- Product CRUD fails
- No new events published
- Existing search results stale (eventual consistency trade-off)
- User Service, Search Service unaffected

**If Search Service is down**:
- Search endpoint returns 503
- Product Service still works
- Kafka events queue up (not consumed, but stored in broker)

### Kafka Resilience

```
Producer (Product Service) → Kafka Broker (3 replicas)
           ↑
         If broker dies, ISR reduced
         Message still acked (min.insync.replicas=2)
           ↓
Consumer (Search Service) ← Consume and offset commit
           ↑
         If consumer dies, another joins same group
         Re-consumes from last committed offset
```

### Database Resilience

- PostgreSQL: Streaming replication (automatic failover with external tools)
- MongoDB: Replica set (automatic failover, quorum-based)
- Elasticsearch: Primary + replica shards (automatic recovery)

---

## Monitoring Points (Phase 2)

### Metrics to Collect

**Gateway**:
- Request count by endpoint
- Latency percentiles (p50, p95, p99)
- Error rate by status code
- Rate limit hits

**User Service**:
- Signup/login latency
- PostgreSQL connection pool utilization
- Password hash time (should be ~100ms)
- JWT validation failures

**Product Service**:
- CRUD operation latency
- MongoDB query performance
- Kafka publish latency
- Kafka event processing lag

**Search Service**:
- Elasticsearch query latency
- Index size + document count
- Kafka consumer lag
- Indexing latency (time from product creation to search)

### Logs to Aggregate (Winston)

- Request/response logs with request ID
- Error logs with stack traces
- Application logs (startup, shutdown, configuration)

### Distributed Tracing (OpenTelemetry + Jaeger)

- Trace cross-service requests (request ID propagation)
- Identify slow services in call chain
- Visualize complete user transaction flow

---

## Security Measures

### Implemented (Phase 1)

1. **Password Security**:
   - bcryptjs with 10 salt rounds (cost=10)
   - Passwords never logged or returned
   - No password in JWT claims

2. **Token Security**:
   - Short-lived access tokens (15 minutes)
   - Refresh tokens rotated on use (implement in Phase 2)
   - Tokens signed with HS256 (HMAC-SHA256)

3. **Input Validation**:
   - Joi schemas on all inputs
   - Email format validation
   - Length restrictions
   - Type coercion

4. **Rate Limiting**:
   - 100 requests per 15 minutes (per user or IP)
   - Prevents brute force attacks

5. **Error Messages**:
   - Generic fail messages ("Invalid email or password" not "No user found")
   - No stack traces on 4xx/5xx responses

### To Implement (Phase 2)

1. **HTTPS/TLS**: All traffic encrypted
2. **API Key Rotation**: Secrets in .env, not in code
3. **CORS Configuration**: Restrict origins
4. **Helmet.js middleware**: Security headers
5. **SQL Injection Prevention**: Already using ORMs (TypeORM, Mongoose)
6. **CSRF Protection**: For form-based endpoints
7. **Audit Logging**: Track who did what, when
8. **Two-Factor Authentication**: MFA for admins

---

## Performance Optimization

### Current Optimizations

1. **Database Indexing**:
   - PostgreSQL: email, username (users table)
   - MongoDB: SKU, category, isActive (products collection)
   - Elasticsearch: Tokenized fields for full-text search

2. **Pagination**:
   - Default limit 20, max 100
   - Offset-based pagination

3. **Connection Pooling**:
   - TypeORM connection pool
   - Mongoose connection pool
   - Elasticsearch client auto-pools

4. **Caching** (to implement):
   - Redis for product listings
   - Search results caching
   - Category cache

### Future Optimizations

1. **GraphQL API** (alternative to REST)
2. **Batch Operations** (bulk product creation)
3. **Async Processing** (image processing, email, etc.)
4. **CDN** (static assets: product images)
5. **Response Compression** (gzip)

---

## Deployment Checklist

### Pre-Production

- [ ] All secrets in environment, not in code
- [ ] HTTPS enforced (via reverse proxy/load balancer)
- [ ] JWT secret is strong and unique
- [ ] Database backups automated
- [ ] Kafka data replicated across multiple brokers
- [ ] Database replication configured
- [ ] Monitoring & alerting set up
- [ ] Load testing done (target: 1000 concurrent users)
- [ ] Disaster recovery plan documented

### Kubernetes Deployment

- [ ] YAML manifests created for each service
- [ ] Resource limits/requests set
- [ ] Health checks configured (livenessProbe, readinessProbe)
- [ ] HPA (Horizontal Pod Autoscaler) configured
- [ ] PVC for stateful components (Kafka, databases)
- [ ] ConfigMap for non-secret config
- [ ] Secret objects for credentials
- [ ] Network policies configured

---

## Glossary

- **ACID**: Atomicity, Consistency, Isolation, Durability (database properties)
- **DLQ**: Dead Letter Queue (failed events)
- **Eventual Consistency**: final state is consistent, but takes time
- **HSA**: High-Speed Architecture (scales horizontally)
- **ISR**: In-Sync Replicas (Kafka quorum)
- **Loose Coupling**: Services depend on interfaces, not implementation
- **RTO**: Recovery Time Objective
- **RPO**: Recovery Point Objective
- **SLA**: Service Level Agreement (uptime commitment)

---

Last Updated: March 19, 2026
