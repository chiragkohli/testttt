FROM node:20-alpine

WORKDIR /app

# Copy entire monorepo structure
COPY . .

# Install dependencies with workspace resolution at root level
RUN npm install --legacy-peer-deps

# Expose port
EXPOSE 3001

# Start service
CMD ["node", "services/user-service/src/server.js"]
