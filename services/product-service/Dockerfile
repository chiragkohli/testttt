FROM node:20-alpine

WORKDIR /app

# Copy root package files for npm workspaces
COPY package.json package-lock.json* ./

# Copy shared package
COPY shared/package.json ./shared/

# Copy product-service package
COPY services/product-service/package.json ./services/product-service/

# Install all dependencies (including workspace dependencies)
RUN npm install --legacy-peer-deps

# Copy the rest of shared code
COPY shared ./shared

# Copy the rest of product-service code
COPY services/product-service ./services/product-service

# Copy infra
COPY infra ./infra

# Expose port
EXPOSE 3002

# Start service
CMD ["node", "services/product-service/src/server.js"]
