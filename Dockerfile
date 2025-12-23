# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Configure npm for better network handling
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000 && \
    npm config set registry https://registry.npmjs.org/

# Copy package files
COPY package*.json ./

# Install dependencies with retry logic and network resilience
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps || \
    (echo "First attempt failed, retrying..." && sleep 10 && npm ci --prefer-offline --no-audit --legacy-peer-deps) || \
    (echo "Second attempt failed, retrying..." && sleep 15 && npm ci --prefer-offline --no-audit --legacy-peer-deps)

# Copy application code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL=http://localhost:8000/api/v1

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
