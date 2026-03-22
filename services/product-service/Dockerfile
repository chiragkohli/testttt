FROM node:20-alpine

WORKDIR /app

# Copy root and shared packages
COPY package.json .
COPY shared ./shared
COPY services/product-service ./services/product-service
COPY infra ./infra

# Install dependencies
RUN npm install

# Expose port
EXPOSE 3002

# Start service
WORKDIR /app/services/product-service
CMD ["npm", "start"]
