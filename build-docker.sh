#!/bin/bash

# Script to build Docker image for ori-app
# Usage: ./build-docker.sh [tag]

set -e

# Default tag
TAG=${1:-latest}
IMAGE_NAME="ori-app"

echo "🐳 Building Docker image: ${IMAGE_NAME}:${TAG}"

# Build the image
docker build -t ${IMAGE_NAME}:${TAG} -f Dockerfile .

echo "✅ Docker image built successfully: ${IMAGE_NAME}:${TAG}"

# Optionally show image info
echo ""
echo "📦 Image details:"
docker images ${IMAGE_NAME}:${TAG}

