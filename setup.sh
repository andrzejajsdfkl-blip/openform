#!/bin/bash
# OpenForm Studio Development Setup Script

set -e

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "✅ Build complete!"
echo ""
echo "🚀 To start development server, run:"
echo "   npm run dev"
echo ""
echo "🐳 To run in Docker, use:"
echo "   docker-compose up"
