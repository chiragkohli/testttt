FROM node:20-alpine

WORKDIR /app

# Copy entire monorepo structure
COPY . .

# Install dependencies with workspace resolution at root level
RUN npm install --legacy-peer-deps

# Expose port
EXPOSE 3002

# Start service
CMD ["node", "services/product-service/src/server.js"]
