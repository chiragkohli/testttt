# Operations & Troubleshooting Guide

## Quick Start Reference

### Start the System

```bash
cd c:\D\E-Commerce\Codebase\backend
docker-compose up
```

Wait 30-60 seconds for all services to be healthy.

### Verify All Services

```bash
# Check all containers running
docker-compose ps

# Expected output (all should be "running")
ecommerce-postgres           ✓ running
ecommerce-mongodb            ✓ running
ecommerce-elasticsearch      ✓ running
ecommerce-zookeeper          ✓ running
ecommerce-kafka              ✓ running
ecommerce-api-gateway         ✓ running
ecommerce-user-service        ✓ running
ecommerce-product-service     ✓ running
ecommerce-search-service      ✓ running
```

### Stop All Services

```bash
docker-compose down

# With full cleanup (removes volumes, networks)
docker-compose down -v
```

---

## Testing the System

### 1. Health Checks

```bash
# API Gateway
curl http://localhost:3000/health

# Response should be:
{
  "success": true,
  "statusCode": 200,
  "message": "Gateway is healthy"
}
```

### 2. User Service - Registration Flow

```bash
# Sign up new user
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Response (201 Created):
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {...},
    "accessToken": "eyJhbGc...",
    "refreshToken": "..."
  }
}

# Save the accessToken for next requests
TOKEN="eyJhbGc..."
```

### 3. User Service - Retrieve Profile

```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"

# Should return user profile (200 OK)
```

### 4. Product Service - Create Product (Admin Only)

First, register an ADMIN user in PostgreSQL (direct insert):

```bash
# Access PostgreSQL container
docker exec -it ecommerce-postgres psql -U postgres -d ecommerce_users

# SQL to make a user admin
UPDATE users SET role = 'ADMIN' WHERE email = 'test@example.com';
\q

# Now log in as that user to get admin token
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'

# Save the accessToken
ADMIN_TOKEN="eyJhbGc..."

# Create a product
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "SHIRT-001",
    "name": "Blue Cotton T-Shirt",
    "description": "Comfortable 100% cotton tee",
    "category": "clothing",
    "price": 599,
    "discountPercentage": 10,
    "stockQuantity": 100,
    "images": [],
    "attributes": {
      "size": "M",
      "color": "Blue",
      "material": "Cotton"
    }
  }'

# Response (201 Created)
```

### 5. Product Service - List Products

```bash
curl "http://localhost:3000/api/products?page=1&limit=20"

# Response with pagination
```

### 6. Search Service - Search Products

Wait 5-10 seconds after creating products (Kafka event processing).

```bash
# Full-text search
curl "http://localhost:3000/api/search?q=shirt&minPrice=500"

# Should return the product you created

# Autocomplete
curl "http://localhost:3000/api/search/autocomplete?prefix=shirt"

# Get filters
curl "http://localhost:3000/api/search/filters"
```

---

## Viewing Logs

### All Services

```bash
docker-compose logs -f
```

### Specific Service

```bash
docker-compose logs -f api-gateway
docker-compose logs -f user-service
docker-compose logs -f product-service
docker-compose logs -f search-service
docker-compose logs -f postgres
docker-compose logs -f mongodb
docker-compose logs -f elasticsearch
docker-compose logs -f kafka
```

### Last N Lines

```bash
# Last 50 lines
docker-compose logs --tail 50 user-service

# Follow in real-time
docker-compose logs -f user-service
```

---

## Database Access

### PostgreSQL (Users)

```bash
# Connect to PostgreSQL
docker exec -it ecommerce-postgres psql -U postgres -d ecommerce_users

# Common queries:
SELECT * FROM users;
SELECT * FROM users WHERE role = 'ADMIN';
UPDATE users SET role = 'ADMIN' WHERE id = '<uuid>';
DELETE FROM users WHERE email = 'test@example.com';

# Exit
\q
```

### MongoDB (Products)

```bash
# Connect to MongoDB
docker exec -it ecommerce-mongodb mongosh -u mongodb -p mongodb_password

# Use database
use ecommerce_products;

# Common queries:
db.products.find().pretty();
db.products.find({ category: "clothing" });
db.products.count();
db.products.deleteMany({});  # Delete all products

# Exit
exit
```

### Elasticsearch (Search Index)

```bash
# Get cluster health
curl http://localhost:9200/_cluster/health

# Get index stats
curl http://localhost:9200/products/_stats

# List all indices
curl http://localhost:9200/_cat/indices

# Search index
curl -X POST http://localhost:9200/products/_search \
  -H "Content-Type: application/json" \
  -d '{
    "query": { "match_all": {} },
    "size": 10
  }'

# Delete index (to reset search)
curl -X DELETE http://localhost:9200/products
```

---

## Common Issues & Solutions

### Issue 1: Services won't start - "Address already in use"

**Problem**: Port 3000, 3001, etc. already in use

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml and .env files
```

---

### Issue 2: Database connection fails

**Problem**: Services can't connect to PostgreSQL/MongoDB

**Symptoms**:
```
Failed to connect to database
Unable to reach mongodb://mongodb:27017
```

**Solution**:
```bash
# Check if database container is running
docker-compose ps

# If not running, start it
docker-compose up postgres mongodb

# If running but not healthy, restart
docker-compose restart postgres
docker-compose restart mongodb

# Check logs
docker-compose logs postgres
docker-compose logs mongodb
```

---

### Issue 3: Kafka events not being consumed (Search Service)

**Problem**: Products created, but don't appear in search results after 10 seconds

**Symptoms**:
```
Search returns 0 results even though product was created
Product visible in /api/products but not in /api/search
```

**Solution**:
```bash
# Check Kafka consumer lag
docker exec ecommerce-kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group search-index-consumer \
  --describe

# If lag is high, the Search Service is not consuming
# Check Search Service logs
docker-compose logs -f search-service

# Restart Search Service
docker-compose restart search-service

# Check if topic exists
docker exec ecommerce-kafka kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --list

# Re-create topic if missing
docker exec ecommerce-kafka kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create \
  --topic product-events \
  --partitions 3 \
  --replication-factor 1
```

---

### Issue 4: Elasticsearch index is empty

**Problem**: Search endpoint returns 0 results

**Solution**:
```bash
# Check if index exists
curl http://localhost:9200/products

# If not, it needs to be created by Search Service
# Check Search Service logs
docker-compose logs search-service

# Re-index: delete old index and recreate
curl -X DELETE http://localhost:9200/products

# Create new products (service auto-indexes)
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d {...}

# Wait 5 seconds, then search
curl "http://localhost:3000/api/search?q=..."
```

---

### Issue 5: Admin operations fail (403 Forbidden)

**Problem**: Creating products returns 403 Forbidden even with token

**Cause**: User token doesn't have ADMIN role

**Solution**:
```bash
# Make user admin in PostgreSQL
docker exec -it ecommerce-postgres psql -U postgres -d ecommerce_users

# Find admin users
SELECT * FROM users WHERE role = 'ADMIN';

# Make specific user admin
UPDATE users SET role = 'ADMIN' WHERE email = 'user@example.com';

# Logout and log back in to get new token
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "..."}'

# Use the new token (will have admin role)
```

---

### Issue 6: Gateway returns 503 Service Unavailable

**Problem**: Request times out or returns 503

**Cause**: One of the downstream services is not responding

**Solution**:
```bash
# Check which service is down
docker-compose ps

# Check logs of the failing service
docker-compose logs user-service
docker-compose logs product-service
docker-compose logs search-service

# Restart the failing service
docker-compose restart user-service

# If persistent, check application logs
docker-compose logs --tail 100 user-service
```

---

### Issue 7: High memory/CPU usage

**Problem**: Services consuming too much resources

**Solution**:
```bash
# Check Docker stats
docker stats

# Check which container is consuming resources
# Restart the problematic container
docker-compose restart product-service

# Check for memory leaks in logs
docker-compose logs product-service | grep -i "error\|fatal"

# Scale services (not directly applicable to docker-compose, but for k8s)
```

---

## Performance Tuning

### Database Query Optimization

```bash
# PostgreSQL - Check slow queries
docker exec ecommerce-postgres psql -U postgres -d ecommerce_users

# Enable query logging
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

# View logs
docker-compose logs postgres | grep duration
```

### Elasticsearch Query Optimization

```bash
# Check query performance
curl -X POST http://localhost:9200/products/_search?explain \
  -H "Content-Type: application/json" \
  -d '{
    "query": { "match": { "name": "shirt" } }
  }'

# Check index stats
curl http://localhost:9200/products/_stats
```

### Kafka Performance

```bash
# Monitor throughput
docker exec ecommerce-kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group search-index-consumer \
  --describe

# Look at "LAG" column - should be 0 for real-time processing
```

---

## Backup & Recovery

### PostgreSQL Backup

```bash
# Full backup
docker exec ecommerce-postgres pg_dump -U postgres ecommerce_users > backup_users.sql

# Restore
docker exec -i ecommerce-postgres psql -U postgres ecommerce_users < backup_users.sql
```

### MongoDB Backup

```bash
# Full backup
docker exec ecommerce-mongodb mongodump \
  -u mongodb -p mongodb_password \
  --authenticationDatabase admin \
  --out /backup/

# Restore
docker exec ecommerce-mongodb mongorestore \
  -u mongodb -p mongodb_password \
  --authenticationDatabase admin \
  /backup/
```

### Elasticsearch Backup

```bash
# Snapshot (backup)
curl -X PUT http://localhost:9200/_snapshot/my-backup \
  -H "Content-Type: application/json" \
  -d '{
    "type": "fs",
    "settings": {
      "location": "/mnt/backups"
    }
  }'

# Take snapshot
curl -X PUT http://localhost:9200/_snapshot/my-backup/snapshot-1
```

---

## Monitoring Checklist

### Daily

- [ ] All services running: `docker-compose ps`
- [ ] No error logs: `docker-compose logs | grep error`
- [ ] Kafka lag < 100: Consumer group describe

### Weekly

- [ ] Database size: PostgreSQL, MongoDB, Elasticsearch
- [ ] Disk space available (docker volume usage)
- [ ] Backup integrity test
- [ ] Performance metrics review

### Monthly

- [ ] Load test (1000 concurrent users)
- [ ] Disaster recovery drill
- [ ] Security audit (unused endpoints, outdated deps)
- [ ] Documentation updates

---

## Useful One-Liners

```bash
# Health check all services
for i in 3000 3001 3002 3003; do 
  echo "Port $i:"; 
  curl -s http://localhost:$i/health | jq .message; 
done

# Count total products in MongoDB
docker exec ecommerce-mongodb mongosh -u mongodb -p mongodb_password \
  --eval "use ecommerce_products; db.products.count()"

# Count documents in Elasticsearch
curl http://localhost:9200/products/_count

# Reset Kafka consumer group (start from latest)
docker exec ecommerce-kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group search-index-consumer \
  --reset-offsets \
  --to-latest \
  --execute
```

---

## Escalation Path

If issues persist:

1. **Check logs** (application, infrastructure)
2. **Check health** (all services, databases, message broker)
3. **Restart failing service** (often solves transient issues)
4. **Check resource usage** (CPU, memory, disk)
5. **Review recent changes** (code, config, data)
6. **Scale resources** (add replicas, increase DB connections)
7. **Contact team lead** (production incident)

---

## Reference Commands

```bash
# View all Docker images
docker images | grep ecommerce

# Build specific service
docker-compose build user-service

# Update single service without stopping others
docker-compose up -d user-service

# Execute command in container
docker-compose exec user-service npm run test

# View environment variables
docker-compose exec user-service env

# SSH into container (debugging)
docker-compose exec user-service /bin/sh
```

---

Last Updated: March 19, 2026
