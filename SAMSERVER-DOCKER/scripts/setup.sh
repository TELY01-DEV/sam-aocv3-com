#!/bin/bash

# AOC V2 Centralized Server Setup Script
# Sets up the new Docker-based centralized server

set -e

echo "🚀 Setting up AOC V2 Centralized Server..."
echo "📅 $(date)"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs/{api,websocket,monitor,p1,nginx}
mkdir -p backup
mkdir -p ssl
mkdir -p ambulance_images

echo "✅ Directories created"
echo ""

# Set permissions
echo "🔐 Setting permissions..."
chmod 755 logs
chmod 755 backup
chmod 755 ambulance_images
chmod 644 env.production

echo "✅ Permissions set"
echo ""

# Build Docker images
echo "🔨 Building Docker images..."
docker-compose build

echo "✅ Docker images built"
echo ""

# Start services
echo "🚀 Starting services..."
docker-compose up -d

echo "✅ Services started"
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "📊 Service Health Check:"

# Check MongoDB
if docker-compose exec -T samserver-mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
    echo "✅ MongoDB: Healthy"
else
    echo "❌ MongoDB: Unhealthy"
fi

# Check Redis
if docker-compose exec -T samserver-redis redis-cli ping &> /dev/null; then
    echo "✅ Redis: Healthy"
else
    echo "❌ Redis: Unhealthy"
fi

# Check API Server
if curl -f http://localhost:3000/ &> /dev/null; then
    echo "✅ API Server: Healthy"
else
    echo "❌ API Server: Unhealthy"
fi

# Check WebSocket Server
if curl -f http://localhost:5055/ &> /dev/null; then
    echo "✅ WebSocket Server: Healthy"
else
    echo "❌ WebSocket Server: Unhealthy"
fi

# Check Nginx
if curl -f http://localhost/ &> /dev/null; then
    echo "✅ Nginx: Healthy"
else
    echo "❌ Nginx: Unhealthy"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "  🌐 API Server: http://localhost:3000"
echo "  🔌 WebSocket: http://localhost:5055"
echo "  🖼️  Images: http://localhost/ambulance_images/"
echo "  📊 Monitoring: http://localhost:9090"
echo ""
echo "📝 Next steps:"
echo "  1. Run data migration: ./scripts/migrate-data.sh"
echo "  2. Update ambulance box configurations"
echo "  3. Test the system"
echo ""
echo "📅 $(date)"