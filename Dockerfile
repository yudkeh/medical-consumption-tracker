# Combined Dockerfile for frontend + backend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copy frontend source and build
COPY frontend ./
RUN npm run build

# Backend stage
FROM node:18-alpine

WORKDIR /app

# Copy backend package.json and install dependencies
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --production

# Copy backend source
COPY backend/src ./src

# Copy built frontend from frontend-build stage
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Expose port
ENV PORT=3001
EXPOSE 3001

# Start server
CMD ["npm", "start"]

