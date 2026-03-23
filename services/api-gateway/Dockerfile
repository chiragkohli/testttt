FROM node:20-alpine

WORKDIR /app

# Copy root package files for npm workspaces
COPY package.json package-lock.json* ./

# Copy shared package
COPY shared/package.json ./shared/

# Copy api-gateway package
COPY services/api-gateway/package.json ./services/api-gateway/

# Install all dependencies (including workspace dependencies)
RUN npm install --legacy-peer-deps

# Copy the rest of shared code
COPY shared ./shared

# Copy the rest of api-gateway code
COPY services/api-gateway ./services/api-gateway

# Expose port
EXPOSE 3000

# Start service
CMD ["node", "services/api-gateway/src/server.js"]
