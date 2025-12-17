FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --production

# Copy source
COPY backend/src ./src

# Environment and port
ENV PORT=3001
EXPOSE 3001

# Start backend
CMD ["npm", "start"]

{
  "cells": [],
  "metadata": {
    "language_info": {
      "name": "python"
    }
  },
  "nbformat": 4,
  "nbformat_minor": 2
}