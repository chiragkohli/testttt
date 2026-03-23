FROM node:20-alpine

WORKDIR /app

# Copy root package files for npm workspaces
COPY package.json package-lock.json* ./

# Copy shared package
COPY shared/package.json ./shared/

# Copy user-service package
COPY services/user-service/package.json ./services/user-service/

# Install all dependencies (including workspace dependencies)
RUN npm install --legacy-peer-deps

# Copy the rest of shared code
COPY shared ./shared

# Copy the rest of user-service code
COPY services/user-service ./services/user-service

# Expose port
EXPOSE 3001

# Start service
CMD ["node", "services/user-service/src/server.js"]
