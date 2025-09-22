#!/bin/bash

# AOC V2 API Server Configuration Update Script
# This script updates the API server configuration to use the new Docker database

set -e

echo "=========================================="
echo "AOC V2 API Server Configuration Update"
echo "=========================================="

# Configuration
API_SERVER_HOST="117.18.126.118"
API_SERVER_USER="samserver"
API_SERVER_PORT="2222"
API_SERVER_PATH="/home/samserver/aocv2trackingserver-master"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check SSH connection
check_ssh_connection() {
    print_status "Checking SSH connection to API server..."
    
    if ssh -p "$API_SERVER_PORT" "$API_SERVER_USER@$API_SERVER_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        print_success "SSH connection to API server successful"
        return 0
    else
        print_error "SSH connection to API server failed"
        return 1
    fi
}

# Function to backup current configuration
backup_configuration() {
    print_status "Backing up current API server configuration..."
    
    ssh -p "$API_SERVER_PORT" "$API_SERVER_USER@$API_SERVER_HOST" "
        cd $API_SERVER_PATH
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        echo 'Configuration backup created'
    "
    
    print_success "Configuration backup completed"
}

# Function to update environment configuration
update_environment() {
    print_status "Updating API server environment configuration..."
    
    # Create new .env content
    cat > /tmp/aocv2_new.env << 'EOF'
NODE_ENV=LIVE
SOCKET_SERVER_PORT=5050

# Database Configuration (Updated to use Docker database)
LIVE_DB_USER=admin
LIVE_DB_USER_PSW=ThaiAocV21
LIVE_DB_HOST=117.18.126.118
LIVE_DB_HOST_PORT=27017
LIVE_DB=aoc_v2
LIVE_AUTH_DB=admin

# Redis Configuration (Updated to use Docker database)
LIVE_REDIS_HOST=117.18.126.118
LIVE_REDIS_PORT=6379
LIVE_REDIS_PASSWORD=aocv2@123!

# MongoDB Connection String (Updated to use Docker database)
MONGODB_LIVE_URL=mongodb://admin:ThaiAocV21%40@117.18.126.118:27017/aoc_v2?authSource=admin

# External Services (Keep same)
GOOGLE_MAP_KEY=AIzaSyAIOJRDeFlwPICCvcabVmjoscJgVzs63Ls
FCM_SERVER_KEY=AAAA8uxbopM:APA91bFF8t6ItmNKC6QD9FlWgWKpKLYHFA5tpwiq3MxbcpmMMx14PnFTDDzhlxmbzzdniLTya6k6El_bvnGftpZ3Q3dDpA_g2EEpfnb_VF2uMeqlhvLESrKNdvhWgpb9Wm14GvsPngZy
EOF

    # Copy new configuration to API server
    scp -P "$API_SERVER_PORT" /tmp/aocv2_new.env "$API_SERVER_USER@$API_SERVER_HOST:$API_SERVER_PATH/.env"
    
    # Clean up temporary file
    rm /tmp/aocv2_new.env
    
    print_success "Environment configuration updated"
}

# Function to test database connection
test_database_connection() {
    print_status "Testing database connection from API server..."
    
    ssh -p "$API_SERVER_PORT" "$API_SERVER_USER@$API_SERVER_HOST" "
        cd $API_SERVER_PATH
        
        # Test MongoDB connection
        echo 'Testing MongoDB connection...'
        node -e \"
            const mongoose = require('mongoose');
            const url = 'mongodb://admin:ThaiAocV21%40@117.18.126.118:27017/aoc_v2?authSource=admin';
            mongoose.connect(url, {socketTimeoutMS: 5000})
                .then(() => {
                    console.log('MongoDB connection successful');
                    mongoose.disconnect();
                })
                .catch(err => {
                    console.error('MongoDB connection failed:', err.message);
                    process.exit(1);
                });
        \"
        
        # Test Redis connection
        echo 'Testing Redis connection...'
        node -e \"
            const redis = require('redis');
            const client = redis.createClient({
                host: '117.18.126.118',
                port: 6379,
                password: 'aocv2@123!',
                connect_timeout: 5000
            });
            client.on('connect', () => {
                console.log('Redis connection successful');
                client.quit();
            });
            client.on('error', (err) => {
                console.error('Redis connection failed:', err.message);
                process.exit(1);
            });
        \"
    "
    
    print_success "Database connection tests completed"
}

# Function to restart API server
restart_api_server() {
    print_status "Restarting API server..."
    
    ssh -p "$API_SERVER_PORT" "$API_SERVER_USER@$API_SERVER_HOST" "
        cd $API_SERVER_PATH
        
        # Restart PM2 process
        pm2 restart tracking
        
        # Wait for restart
        sleep 10
        
        # Check PM2 status
        pm2 status
        
        # Check if process is running
        if pm2 list | grep -q 'tracking.*online'; then
            echo 'API server restarted successfully'
        else
            echo 'API server restart failed'
            exit 1
        fi
    "
    
    print_success "API server restarted successfully"
}

# Function to test API endpoints
test_api_endpoints() {
    print_status "Testing API endpoints..."
    
    # Test health endpoint
    if curl -f "http://$API_SERVER_HOST:5000/" >/dev/null 2>&1; then
        print_success "Health endpoint is accessible"
    else
        print_error "Health endpoint is not accessible"
        return 1
    fi
    
    # Test WebSocket endpoint
    if curl -f "http://$API_SERVER_HOST:5050/" >/dev/null 2>&1; then
        print_success "WebSocket endpoint is accessible"
    else
        print_error "WebSocket endpoint is not accessible"
        return 1
    fi
    
    # Test GPS tracking endpoint
    RESPONSE=$(curl -s -X POST "http://$API_SERVER_HOST:5000/api/tracking/postAmbulanceTracking" \
        -H "Content-Type: application/json" \
        -d '{
            "ambulance_id": "332",
            "tracking_latitude": 13.7563,
            "tracking_longitude": 100.5018,
            "tracking_speed": 45.5,
            "tracking_heading": 180
        }')
    
    if echo "$RESPONSE" | grep -q "success"; then
        print_success "GPS tracking endpoint is working"
    else
        print_warning "GPS tracking endpoint test failed: $RESPONSE"
    fi
    
    print_success "API endpoint tests completed"
}

# Function to show final status
show_final_status() {
    echo ""
    echo "=========================================="
    echo "AOC V2 API Server Update Summary"
    echo "=========================================="
    echo ""
    echo "API Server: $API_SERVER_HOST:$API_SERVER_PORT"
    echo "Database: MongoDB (117.18.126.118:27017)"
    echo "Cache: Redis (117.18.126.118:6379)"
    echo "WebSocket: Port 5050"
    echo "API: Port 5000"
    echo ""
    echo "Status:"
    echo "  - Configuration updated ✅"
    echo "  - Database connection tested ✅"
    echo "  - API server restarted ✅"
    echo "  - Endpoints tested ✅"
    echo ""
    echo "Next steps:"
    echo "  1. Monitor ambulance box data flow"
    echo "  2. Verify WebSocket communication with AOC Platform Frontend"
    echo "  3. Check system performance and logs"
    echo "  4. Decommission old database server (117.18.126.117)"
    echo ""
    echo "=========================================="
}

# Main update function
main() {
    echo "Starting API server configuration update..."
    echo ""
    
    # Check SSH connection
    if ! check_ssh_connection; then
        print_error "Cannot connect to API server. Please check SSH configuration."
        exit 1
    fi
    
    # Backup current configuration
    backup_configuration
    
    # Update environment configuration
    update_environment
    
    # Test database connection
    test_database_connection
    
    # Restart API server
    restart_api_server
    
    # Test API endpoints
    test_api_endpoints
    
    # Show final status
    show_final_status
    
    print_success "API server configuration update completed successfully!"
}

# Run main function
main "$@"
