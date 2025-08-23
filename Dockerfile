# Multi-stage build for production
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

# Final production image
FROM node:18-alpine
WORKDIR /app

# Install nginx for serving frontend
RUN apk add --no-cache nginx

# Copy backend
COPY --from=backend-builder /app/backend ./backend
WORKDIR /app/backend

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./public

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'nginx -g "daemon off;" &' >> /app/start.sh && \
    echo 'cd /app/backend && npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 80 5000

CMD ["/app/start.sh"]
