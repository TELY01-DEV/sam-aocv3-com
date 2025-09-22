# AOC V2 Docker Direct Data Reception System

## 🎯 New System Architecture

### **Direct Data Reception Approach**
Instead of migrating the existing API server, we're creating a **new Docker system** that will:
- **Receive GPS/Image data directly** from ambulance boxes
- **Store data in the same MongoDB/Redis** databases
- **Broadcast real-time data** to the AOC Platform Frontend
- **Maintain the 81GB ambulance images** storage

### **System Flow**
```mermaid
graph TD
    A[16 Ambulance Boxes] -->|POST GPS/Image Data| B[New Docker System]
    B --> C[MongoDB Database]
    B --> D[Redis Cache]
    B --> E[81GB Image Storage]
    B -->|WebSocket Broadcast| F[AOC Platform Frontend]
    
    G[Current PM2 System] -.->|Legacy| H[Old API Server]
    
    style B fill:#90EE90
    style H fill:#FFB6C1
```

---

## 🏗️ Docker System Architecture

### **Multi-Container Setup**
```yaml
version: '3.8'
services:
  aocv2-app:
    build: .
    ports:
      - "5000:5000"  # GPS/Image API endpoints
      - "5050:5050"  # WebSocket server
    volumes:
      - ./ambulance_images:/app/public/uploads/ambulance_images
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - MONGODB_LIVE_URL=${MONGODB_LIVE_URL}
      - LIVE_REDIS_HOST=${LIVE_REDIS_HOST}
      - LIVE_REDIS_PORT=${LIVE_REDIS_PORT}
      - LIVE_REDIS_PASSWORD=${LIVE_REDIS_PASSWORD}
      - GOOGLE_MAP_KEY=${GOOGLE_MAP_KEY}
      - FCM_SERVER_KEY=${FCM_SERVER_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/"]
      interval: 30s
      timeout: 10s
      retries: 3

  aocv2-nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - ./ambulance_images:/var/www/ambulance_images
    depends_on:
      - aocv2-app
    restart: unless-stopped

volumes:
  ambulance_images:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /home/samserver/aocv2trackingserver-master/public/uploads/ambulance_images
```

---

## 📋 Implementation Steps

### **Phase 1: Create New Docker System**

#### 1. **Dockerfile** (Direct Data Reception)
```dockerfile
FROM node:21-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create directories for data
RUN mkdir -p /app/public/uploads/ambulance_images
RUN mkdir -p /app/logs

# Expose ports
EXPOSE 5000 5050

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/ || exit 1

# Start application
CMD ["node", "server.js"]
```

#### 2. **Nginx Configuration** (Direct Data Reception)
```nginx
events {
    worker_connections 1024;
}

http {
    upstream aocv2_backend {
        server aocv2-app:5000;
    }
    
    upstream aocv2_websocket {
        server aocv2-app:5050;
    }
    
    # Main API server for ambulance boxes
    server {
        listen 80;
        server_name sam.aocv2.com;
        
        # GPS tracking endpoint
        location /api/tracking/postAmbulanceTracking {
            proxy_pass http://aocv2_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Image upload endpoint
        location /api/snapshot/postAmbulanceImageUpload {
            proxy_pass http://aocv2_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            client_max_body_size 50M;
        }
        
        # Crash notification endpoint
        location /api/crash/postAmbulanceCrashNotify {
            proxy_pass http://aocv2_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Health check
        location / {
            proxy_pass http://aocv2_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # Serve ambulance images
        location /ambulance_images/ {
            alias /var/www/ambulance_images/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # WebSocket server for AOC Platform Frontend
    server {
        listen 80;
        server_name sam-gps.aocv2.com;
        
        location / {
            proxy_pass http://aocv2_websocket;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### 3. **Environment Configuration**
```bash
# .env file for new Docker system
NODE_ENV=production
SOCKET_SERVER_PORT=5050

# Database Configuration (Same as current system)
LIVE_DB_USER=admin
LIVE_DB_USER_PSW=ThaiAocV21
LIVE_DB_HOST=192.168.100.117
LIVE_DB_HOST_PORT=27017
LIVE_DB=aoc_v2
LIVE_AUTH_DB=admin

# Redis Configuration (Same as current system)
LIVE_REDIS_HOST=117.18.126.117
LIVE_REDIS_PORT=6379
LIVE_REDIS_PASSWORD=aocv2@123!

# MongoDB Connection String (Same as current system)
MONGODB_LIVE_URL=mongodb://admin:ThaiAocV21%40@117.18.126.117:27017/aoc_v2?authSource=admin

# External Services (Same as current system)
GOOGLE_MAP_KEY=AIzaSyAIOJRDeFlwPICCvcabVmjoscJgVzs63Ls
FCM_SERVER_KEY=AAAA8uxbopM:APA91bFF8t6ItmNKC6QD9FlWgWKpKLYHFA5tpwiq3MxbcpmMMx14PnFTDDzhlxmbzzdniLTya6k6El_bvnGftpZ3Q3dDpA_g2EEpfnb_VF2uMeqlhvLESrKNdvhWgpb9Wm14GvsPngZy
```

---

## 🔄 Data Migration Strategy

### **Parallel System Approach**
1. **Current PM2 System**: Continue running (117.18.126.118)
2. **New Docker System**: Deploy alongside (same server or new server)
3. **Gradual Migration**: Redirect ambulance boxes one by one
4. **Data Consistency**: Both systems write to same MongoDB/Redis

### **Migration Steps**
```bash
# 1. Deploy new Docker system
docker-compose up -d --build

# 2. Test with 1-2 ambulance boxes
# Update ambulance box configuration to point to new system

# 3. Monitor data consistency
# Check MongoDB for data from both systems

# 4. Gradually migrate more ambulance boxes
# Redirect 5-10 ambulance boxes to new system

# 5. Full migration
# All 16 ambulance boxes → New Docker system
# AOC Platform Frontend → New WebSocket server

# 6. Decommission old PM2 system
# Stop PM2 processes after full migration
```

---

## 📊 Expected Benefits

### **Direct Data Reception Benefits**
- **Simplified Architecture**: No API server intermediary
- **Better Performance**: Direct data processing
- **Reduced Latency**: Fewer network hops
- **Easier Scaling**: Container-based horizontal scaling
- **Better Monitoring**: Container health checks and metrics

### **Data Consistency**
- **Same Database**: MongoDB and Redis remain unchanged
- **Same Data Format**: GPS/Image/Crash data structure preserved
- **Same WebSocket**: AOC Platform Frontend receives same data format
- **Same Storage**: 81GB ambulance images preserved

---

## 🚀 Implementation Commands

### **Setup New Docker System**
```bash
# 1. Create new directory
mkdir aocv2-docker-new
cd aocv2-docker-new

# 2. Copy application code
cp -r ../aocv2trackingserver-master ./

# 3. Create Docker files
# (Dockerfile, docker-compose.yml, nginx.conf, .env)

# 4. Build and start
docker-compose up -d --build

# 5. Check status
docker-compose ps
docker-compose logs -f aocv2-app
```

### **Test Data Reception**
```bash
# Test GPS tracking endpoint
curl -X POST http://localhost:5000/api/tracking/postAmbulanceTracking \
  -H "Content-Type: application/json" \
  -d '{
    "ambulance_id": "332",
    "tracking_latitude": 13.7563,
    "tracking_longitude": 100.5018,
    "tracking_speed": 45.5,
    "tracking_heading": 180
  }'

# Test WebSocket connection
curl http://localhost:5050/

# Check health
curl http://localhost:5000/
```

---

## ❓ Ready to Implement?

**Yes! We can create the new Docker system that receives data directly from ambulance boxes.**

Would you like me to:
1. **Create the Dockerfile for direct data reception?**
2. **Create docker-compose.yml for the new system?**
3. **Create Nginx configuration for direct data endpoints?**
4. **Set up the environment configuration?**
5. **Create the migration strategy?**

The new system will:
- ✅ **Receive GPS/Image data directly** from 16 ambulance boxes
- ✅ **Store data in same MongoDB/Redis** databases
- ✅ **Broadcast real-time data** to AOC Platform Frontend
- ✅ **Preserve 81GB ambulance images** storage
- ✅ **Eliminate PM2 stability issues**

Which component should I create first?

---

**Document Version:** 1.0  
**Last Updated:** September 10, 2025  
**Status:** Ready for Direct Data Reception Implementation  
**Next Action:** Awaiting user direction for specific implementation steps
