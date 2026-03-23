FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

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
COPY services/user-service ./services/user-service
COPY infra ./infra

# Expose port
EXPOSE 3001

# Start service
CMD ["node", "services/user-service/src/server.js"]
