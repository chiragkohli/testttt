FROM node:20-alpine

WORKDIR /app

# Copy root and shared packages
COPY package.json .
COPY shared ./shared
COPY services/api-gateway ./services/api-gateway

# Install dependencies
RUN npm install

# Expose port
EXPOSE 3000

# Start service
WORKDIR /app/services/api-gateway
CMD ["npm", "start"]
