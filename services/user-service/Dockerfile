FROM node:20-alpine

WORKDIR /app

# Copy root and shared packages
COPY package.json .
COPY shared ./shared
COPY services/user-service ./services/user-service

# Install dependencies
RUN npm install

# Build shared library
WORKDIR /app/shared
RUN npm run build

# Build user service
WORKDIR /app/services/user-service
RUN npm run build

# Expose port
EXPOSE 3001

# Start service
CMD ["npm", "start"]
