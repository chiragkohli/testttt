FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy all service package.json files (required for npm workspaces)
COPY shared/package.json ./shared/
COPY services/user-service/package.json ./services/user-service/
COPY services/product-service/package.json ./services/product-service/
COPY services/search-service/package.json ./services/search-service/
COPY services/api-gateway/package.json ./services/api-gateway/

# Install dependencies with workspace resolution
RUN npm install --legacy-peer-deps

# Copy source code for all services
COPY shared ./shared
COPY services/api-gateway ./services/api-gateway

# Expose port
EXPOSE 3000

# Start service
CMD ["node", "services/api-gateway/src/server.js"]
