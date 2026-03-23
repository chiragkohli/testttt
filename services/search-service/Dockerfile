# Build stage
FROM node:20-slim as builder

WORKDIR /app

# Update npm to latest stable version
RUN npm install -g npm@10.2.0

# Copy entire monorepo structure
COPY . .

# Clear npm cache and install dependencies
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --no-optional && \
    npm cache clean --force

# Production stage
FROM node:20-slim

WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production

# Copy from builder
COPY --from=builder /app .

# Remove development dependencies
RUN npm prune --production

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser

EXPOSE 3003

CMD ["node", "services/search-service/src/server.js"]
