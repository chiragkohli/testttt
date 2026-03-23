FROM node:20-alpine

WORKDIR /app

# Copy root package files for npm workspaces
COPY package.json package-lock.json* ./

# Copy shared package
COPY shared/package.json ./shared/

# Copy search-service package
COPY services/search-service/package.json ./services/search-service/

# Install all dependencies (including workspace dependencies)
RUN npm install --legacy-peer-deps

# Copy the rest of shared code
COPY shared ./shared

# Copy the rest of search-service code
COPY services/search-service ./services/search-service

# Copy infra
COPY infra ./infra

# Expose port
EXPOSE 3003

# Start service
CMD ["node", "services/search-service/src/server.js"]
