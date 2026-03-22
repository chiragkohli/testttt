# E-Commerce Microservices Backend

A production-grade e-commerce backend system using microservices architecture, built with Node.js, Express, TypeScript, and industry-standard tools for enterprise scalability.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Services](#services)
- [API Documentation](#api-documentation)
- [Database Schemas](#database-schemas)
- [Event-Driven Architecture](#event-driven-architecture)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Monitoring & Logging](#monitoring--logging)
- [Development](#development)
- [Testing](#testing)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLIENTS                               │
│                   (Web, Mobile, Desktop)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Port 3000)                    │
│                                                                 │
│  ✓ Request Routing      ✓ Rate Limiting                        │
│  ✓ JWT Validation       ✓ Request Logging                      │
│  ✓ Error Standardization ✓ Request ID Injection               │
└─────────┬──────────┬──────────────┬─────────────────────────────┘
          │          │              │
          ▼          ▼              ▼
    ┌─────────┐ ┌──────────┐ ┌──────────────┐
    │ USER    │ │ PRODUCT  │ │ SEARCH       │
    │ SERVICE │ │ SERVICE  │ │ SERVICE      │
    │ (3001)  │ │ (3002)   │ │ (3003)       │
    └────┬────┘ └────┬─────┘ └──────┬───────┘
         │           │              │
         ▼           ▼              ▼
    ┌─────────┐ ┌──────────┐ ┌────────────────┐
    │PostgreSQL│ │ MongoDB  │ │ Elasticsearch  │
    │ (users)  │ │(products)│ │ (search index) │
    └──────────┘ └──────────┘ └────────────────┘
         
                    ▲ Event Publishing
                    │ (Product Create/Update/Delete)
         ┌──────────┴─────────┐
         │                    │
         ▼                    ▼
    ┌──────────┐          ┌────────┐
    │  KAFKA   │◄────────►│ZOOKEEPER
    │ (9092)   │          │ (2181) │
    └──────────┘          └────────┘
         ▲
         │ Event Consumption
         ▼
    Search Service Indexing → Elasticsearch
```

### Key Architectural Principles

1. **Database per Service**: Each microservice owns its database
2. **Eventual Consistency**: Event-driven communication via Kafka
3. **Stateless Services**: Easy horizontal scaling & deployment
4. **Loose Coupling**: Services communicate only via APIs & events
5. **API Gateway Pattern**: Single entry point for all clients
6. **JWT Authentication**: Distributed, stateless authorization

---

## 🛠️ Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 20 LTS | JavaScript runtime |
| **Framework** | Express | 4.18 | HTTP server & routing |
| **Language** | TypeScript | 5.3 | Type-safe development |
| **ORM/ODM** | TypeORM, Mongoose | Latest | Database access layer |
| **Databases** | PostgreSQL, MongoDB, Elasticsearch | 15, 6, 8.10 | Storage engines |
| **Message Broker** | Kafka | 7.5 | Event streaming |
| **Authentication** | JWT, bcryptjs | Latest | Secure auth & passwords |
| **Validation** | Joi | 17.11 | Input validation |
| **Logging** | Winston | 3.11 | Structured logging |
| **Testing** | Jest, Supertest | Latest | Unit & integration tests |
| **Containerization** | Docker, Docker Compose | Latest | Service orchestration |

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose installed
- Node.js 20+ (for local development)
- Git

### Setup Instructions

1. **Clone or navigate to the backend directory**
   ```bash
   cd c:\D\E-Commerce\Codebase\backend
   ```

2. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Start all services**
   ```bash
   docker-compose up
   ```

4. **Wait for all services to be healthy** (30-60 seconds)
   ```
   ✓ PostgreSQL is ready
   ✓ MongoDB is ready
   ✓ Elasticsearch is ready
   ✓ Kafka is ready
   ✓ User Service is listening
   ✓ Product Service is listening
   ✓ Search Service is listening
   ✓ API Gateway is listening
   ```

5. **Verify the system**
   ```bash
   # Health check
   curl http://localhost:3000/health
   
   # Expected response:
   {
     "success": true,
     "statusCode": 200,
     "message": "Gateway is healthy",
     "data": {
       "service": "api-gateway",
       "status": "up",
       "timestamp": "2026-03-19T10:30:00.000Z"
     }
   }
   ```

### Useful Docker Commands

```bash
# View all services
docker-compose ps

# View logs for specific service
docker-compose logs -f user-service
docker-compose logs -f product-service
docker-compose logs -f search-service
docker-compose logs -f api-gateway

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild specific service
docker-compose up --build user-service

# Access service logs
docker-compose logs api-gateway | head -50
```

---

## 🔧 Services

### 1. API Gateway (Port: 3000)

**Entry point for all client requests**

- Route requests to User, Product, and Search services
- Validate JWT tokens on protected routes
- Implement rate limiting (100 requests/15 minutes per IP)
- Standardize error responses
- Inject request IDs for tracing

**Base URL**: `http://localhost:3000/api`

---

### 2. User Service (Port: 3001)

**User authentication & profile management**

**Database**: PostgreSQL

**Key Features**:
- User registration (email unique, bcrypt password hashing)
- User login (JWT + refresh token issuance)
- Profile retrieval and updates
- Role-based access control (USER, ADMIN)
- Password reset capability
- Session management via refresh tokens

**Environment Variables**:
```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres_password
DB_NAME=ecommerce_users
JWT_SECRET=<your-secret-key>
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

---

### 3. Product Service (Port: 3002)

**Product catalog & inventory management**

**Database**: MongoDB

**Key Features**:
- Create products (admin only)
- List products with filtering (category, price range) and pagination
- Get product details by ID
- Update product information (admin only)
- Delete products (admin only, soft delete)
- Flexible product attributes (size, color, material, etc.)
- Publish Kafka events on create/update/delete

**Environment Variables**:
```env
MONGO_URI=mongodb://mongodb:mongodb_password@mongodb:27017/ecommerce_products?authSource=admin
KAFKA_BROKER=kafka:9092
KAFKA_CLIENT_ID=product-service
```

---

### 4. Search Service (Port: 3003)

**Full-text product search & indexing**

**Database**: Elasticsearch

**Key Features**:
- Full-text search across product name, description, category
- Autocomplete suggestions
- Filtering by category and price range
- Advanced aggregations (categories, price statistics)
- Real-time indexing via Kafka consumer
- Relevance ranking via Elasticsearch scoring

**Environment Variables**:
```env
ELASTICSEARCH_URL=http://elasticsearch:9200
KAFKA_BROKER=kafka:9092
KAFKA_GROUP_ID=search-index-consumer
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```bash
Authorization: Bearer <ACCESS_TOKEN>
```

Tokens are obtained via login and expire in **15 minutes**. Use the refresh token to get a new access token.

---

## 👤 User Service APIs

### 1. User Signup

**Endpoint**: `POST /users/signup`

**Public** (no authentication required)

**Request**:
```bash
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }
```

**Response** (201 Created):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-1234",
      "username": "john_doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "isActive": true,
      "createdAt": "2026-03-19T10:30:00Z"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "refresh-token-here"
  }
}
```

**Validation Rules**:
- Username: 3-30 alphanumeric characters
- Email: Valid e-mail format, unique
- Password: Minimum 8 characters

---

### 2. User Login

**Endpoint**: `POST /users/login`

**Public** (no authentication required)

**Request**:
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d {
    "email": "john@example.com",
    "password": "SecurePass123!"
  }
```

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "refresh-token-here"
  }
}
```

---

### 3. Get User Profile

**Endpoint**: `GET /users/profile`

**Protected** (requires JWT token)

**Request**:
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile retrieved",
  "data": {
    "id": "uuid-1234",
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isActive": true,
    "createdAt": "2026-03-19T10:30:00Z",
    "updatedAt": "2026-03-19T10:30:00Z"
  }
}
```

---

### 4. Update User Profile

**Endpoint**: `PUT /users/profile`

**Protected** (requires JWT token)

**Request**:
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d {
    "firstName": "Jonathan",
    "lastName": "Smith"
  }
```

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": { ... updated user object ... }
}
```

---

## 🛍️ Product Service APIs

### 1. Create Product

**Endpoint**: `POST /products`

**Protected** (requires JWT token with ADMIN role)

**Request**:
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d {
    "sku": "SHIRT-001",
    "name": "Blue Cotton T-Shirt",
    "description": "Comfortable 100% cotton t-shirt",
    "category": "clothing",
    "price": 599,
    "discountPercentage": 10,
    "stockQuantity": 100,
    "images": ["http://example.com/shirt1.jpg"],
    "attributes": {
      "size": "M",
      "color": "Blue",
      "material": "Cotton"
    }
  }
```

**Response** (201 Created):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Product created successfully",
  "data": {
    "_id": "mongo-id",
    "sku": "SHIRT-001",
    "name": "Blue Cotton T-Shirt",
    "category": "clothing",
    "price": 599,
    "discountPercentage": 10,
    "finalPrice": 539,
    "stockQuantity": 100,
    "images": ["http://example.com/shirt1.jpg"],
    "attributes": { "size": "M", "color": "Blue", "material": "Cotton" },
    "ratings": { "average": 0, "count": 0 },
    "isActive": true,
    "createdAt": "2026-03-19T10:30:00Z",
    "updatedAt": "2026-03-19T10:30:00Z"
  }
}
```

---

### 2. List Products

**Endpoint**: `GET /products`

**Public** (no authentication required)

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `category` (optional): Filter by category
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `sortBy` (optional): Sort field (default: createdAt)
- `order` (optional): Sort order - `asc` or `desc` (default: desc)

**Request**:
```bash
curl "http://localhost:3000/api/products?category=clothing&minPrice=500&maxPrice=1000&page=1&limit=20"
```

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products listed",
  "data": {
    "products": [ { ...product objects... } ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

### 3. Get Product by ID

**Endpoint**: `GET /products/:id`

**Public** (no authentication required)

**Request**:
```bash
curl http://localhost:3000/api/products/mongo-id-here
```

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product retrieved",
  "data": { ...product object... }
}
```

---

### 4. Update Product

**Endpoint**: `PUT /products/:id`

**Protected** (requires JWT token with ADMIN role)

**Request**:
```bash
curl -X PUT http://localhost:3000/api/products/mongo-id \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d {
    "name": "Blue Premium Cotton T-Shirt",
    "price": 699,
    "stockQuantity": 80
  }
```

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product updated successfully",
  "data": { ...updated product object... }
}
```

---

### 5. Delete Product

**Endpoint**: `DELETE /products/:id`

**Protected** (requires JWT token with ADMIN role)

**Request**:
```bash
curl -X DELETE http://localhost:3000/api/products/mongo-id \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product deleted successfully"
}
```

---

## 🔍 Search Service APIs

### 1. Search Products

**Endpoint**: `GET /search`

**Public** (no authentication required)

**Query Parameters**:
- `q` (optional): Search query (searches in name, description, category)
- `category` (optional): Filter by category
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Sort field (default: created_at)
- `order` (optional): Sort order - asc or desc (default: desc)

**Request**:
```bash
curl "http://localhost:3000/api/search?q=shirt&category=clothing&minPrice=500&maxPrice=1000"
```

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Search completed",
  "data": {
    "products": [ { ...product objects... } ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### 2. Autocomplete Search

**Endpoint**: `GET /search/autocomplete`

**Public** (no authentication required)

**Query Parameters**:
- `prefix` (required): Text prefix to autocomplete
- `limit` (optional): Number of suggestions (default: 10)

**Request**:
```bash
curl "http://localhost:3000/api/search/autocomplete?prefix=shirt&limit=5"
```

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Suggestions retrieved",
  "data": {
    "suggestions": [
      "Blue Cotton T-Shirt",
      "White Silk Shirt",
      "Striped Casual Shirt",
      "Formal Business Shirt",
      "Sports Shirt"
    ]
  }
}
```

---

### 3. Get Available Filters

**Endpoint**: `GET /search/filters`

**Public** (no authentication required)

**Request**:
```bash
curl "http://localhost:3000/api/search/filters"
```

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Filters retrieved",
  "data": {
    "categories": [
      "clothing",
      "electronics",
      "books",
      "accessories"
    ],
    "priceRange": {
      "min": 99,
      "max": 9999
    }
  }
}
```

---

## 📊 Database Schemas

### PostgreSQL (User Service)

**Table: users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) CHECK (role IN ('USER', 'ADMIN')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Table: refresh_tokens**
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### MongoDB (Product Service)

**Collection: products**
```javascript
{
  _id: ObjectId,
  sku: String (unique, required),
  name: String (required, indexed),
  description: String,
  category: String (required, indexed),
  price: Number (required, min: 0),
  discountPercentage: Number (default: 0, 0-100),
  finalPrice: Number (required, calculated),
  stockQuantity: Number (required, default: 0),
  images: [String],
  attributes: Object (flexible schema),
  ratings: {
    average: Number (0-5, default: 0),
    count: Number (default: 0)
  },
  isActive: Boolean (default: true, indexed),
  createdAt: Date (default: now),
  updatedAt: Date (default: now)
}
```

---

### Elasticsearch (Search Service)

**Index: products**
```json
{
  "product_id": "keyword",
  "sku": "keyword",
  "name": "text (with keyword subfield)",
  "description": "text",
  "category": "keyword",
  "price": "float",
  "discount_percentage": "float",
  "final_price": "float",
  "stock_quantity": "integer",
  "images": "keyword",
  "rating_average": "float",
  "is_active": "boolean",
  "created_at": "date"
}
```

---

## 📨 Event-Driven Architecture

### Kafka Topics

**Topic: product-events**

Events published by Product Service and consumed by Search Service:

#### Event: product.created
```json
{
  "eventId": "uuid",
  "eventType": "product.created",
  "aggregateId": "product-id",
  "aggregateType": "Product",
  "timestamp": "2026-03-19T10:30:00Z",
  "version": 1,
  "payload": {
    "id": "product-id",
    "sku": "SHIRT-001",
    "name": "Blue Cotton T-Shirt",
    "category": "clothing",
    "price": 599,
    "finalPrice": 539,
    "stockQuantity": 100,
    "isActive": true,
    "createdAt": "2026-03-19T10:30:00Z"
  }
}
```

#### Event: product.updated
```json
{
  "eventId": "uuid",
  "eventType": "product.updated",
  "aggregateId": "product-id",
  "timestamp": "2026-03-19T10:35:00Z",
  "payload": {
    "id": "product-id",
    "updatedFields": { "price": 699, "stockQuantity": 80 },
    "newProduct": { ...full product object... }
  }
}
```

#### Event: product.deleted
```json
{
  "eventId": "uuid",
  "eventType": "product.deleted",
  "aggregateId": "product-id",
  "timestamp": "2026-03-19T10:40:00Z",
  "payload": {
    "id": "product-id"
  }
}
```

### Event Flow

```
1. Administrator creates product via API Gateway
2. API Gateway routes POST /api/products to Product Service
3. Product Service:
   - Validates input
   - Stores product in MongoDB
   - Publishes product.created event to Kafka
4. Kafka brokers the event (partition assignment, replication)
5. Search Service consumes event from Kafka
6. Search Service indexes product in Elasticsearch
7. Product appears in /api/search results (~5 seconds guaranteed)
```

---

## ⚙️ Configuration

### Environment Variables

All services read from their respective `.env` files. Template: `.env.example`

### Key Secrets (Change in Production!)

```env
JWT_SECRET=your-very-secret-key-change-in-production
DB_PASSWORD=postgres_password (change this)
MONGO_URI=mongodb://username:password@host:27017/db
```

### Service URLs (Docker Compose)

```
API Gateway:    http://api-gateway:3000
User Service:   http://user-service:3001
Product Service: http://product-service:3002
Search Service: http://search-service:3003
```

---

## 🚢 Deployment

### Local Development

```bash
docker-compose up
```

### Production Deployment

For production, recommended deployment approach:

1. **Kubernetes**:
   - Use provided Dockerfiles with k8s manifests (not included in Phase 1)
   - Configure resource limits, health checks, auto-scaling
   - Use managed databases (RDS PostgreSQL, MongoDB Atlas, Elasticsearch Service)
   - Replace Kafka with managed streaming (MSK, Confluent Cloud)

2. **Environment Configuration**:
   ```bash
   # Use ConfigMaps for non-secrets
   # Use Secrets for sensitive data
   # Update imagePullPolicy to Always
   # Set resource requests/limits
   ```

3. **Service Mesh** (Optional):
   - Istio or Linkerd for service-to-service communication
   - Traffic management and mutual TLS

---

## 📊 Monitoring & Logging

### Logging

All services use Winston logger with:
- Structured JSON logging
- Console output (development)
- File output (production)
- Request ID injection for tracing

**Log Levels**: error, warn, info, debug

### Health Checks

Each service exposes a health check endpoint:
```bash
# Check all services
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

### Metrics (Phase 2)

Future implementation will include:
- Prometheus metrics scraping
- Grafana dashboards
- OpenTelemetry tracing with Jaeger

---

## 💻 Development

### Project Structure

```
backend/
├── shared/                    # Shared utilities, types, middleware
├── services/
│   ├── api-gateway/          # API Gateway (routing, auth)
│   ├── user-service/         # User auth & profile (PostgreSQL)
│   ├── product-service/      # Product catalog (MongoDB + Kafka)
│   └── search-service/       # Full-text search (Elasticsearch + Kafka)
├── infra/
│   └── kafka/               # Kafka producer & consumer helpers
├── docker-compose.yml       # Service orchestration
└── .env.example             # Environment variables template
```

### Local Development Workflow

1. **Add a new endpoint** in the appropriate service
2. **Update types/interfaces** in `shared/src/types/index.ts`
3. **Create controller method** with `asyncHandler` wrapper
4. **Add validation schema** in `shared/src/utils/validation.ts`
5. **Write tests** in service's `src/tests/` folder
6. **Test manually**:
   ```bash
   curl http://localhost:3000/api/...
   ```

### Code Style

- TypeScript strict mode enabled
- ESLint recommended setup (add as needed)
- Prettier formatting (add as needed)
- 2-space indentation
- Async/await for promises
- Proper error handling with custom error classes

---

## 🧪 Testing

### Running Tests

```bash
# All services
npm run test

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch

# Specific service
cd services/user-service && npm run test
```

### Test Structure

```
services/<service>/src/tests/
├── unit/
│   ├── services/
│   ├── repositories/
│   └── utilities/
└── integration/
    └── controllers/
```

### Example Test

```typescript
describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  test('should hash password with bcrypt', async () => {
    const user = await authService.signup({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    expect(user.user.id).toBeDefined();
    expect(user.accessToken).toBeDefined();
    expect(user.refreshToken).toBeDefined();
  });
});
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-19 | Initial release - Core microservices, event-driven architecture, full-text search |

---

## License

MIT

---

## Support & Contributions

For issues, questions, or contributions, please refer to project documentation or contact the development team.

**Last Updated**: March 19, 2026
