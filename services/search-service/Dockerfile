FROM node:20-alpine

WORKDIR /app

# Copy root and shared packages
COPY package.json .
COPY shared ./shared
COPY services/search-service ./services/search-service
COPY infra ./infra

# Install dependencies
RUN npm install

# Expose port
EXPOSE 3003

# Start service
WORKDIR /app/services/search-service
CMD ["npm", "start"]
