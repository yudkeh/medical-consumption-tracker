#!/bin/bash

# Script to build Docker images using docker-compose
# Usage: ./build-docker-compose.sh

set -e

echo "🐳 Building Docker images with docker-compose..."

# Build using docker-compose
docker compose build

echo "✅ Docker images built successfully!"

# Show built images
echo ""
echo "📦 Built images:"
docker images | grep -E "ori|REPOSITORY"

