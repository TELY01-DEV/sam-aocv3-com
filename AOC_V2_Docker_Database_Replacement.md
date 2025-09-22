# AOC V2 Docker Database Replacement System

## 🎯 Correct System Architecture

### **Database Replacement Approach**
Keep the **current API server (117.18.126.118)** but replace the **database server (117.18.126.117)** with a **new Docker database system**.

### **System Flow**
```mermaid
graph TD
    A[15 Ambulance Boxes] -->|POST GPS/Image Data| B[Current API Server<br/>117.18.126.118]
    B --> C[New Docker Database System]
    C --> D[MongoDB Container]
    C --> E[Redis Container]
    B -->|WebSocket Broadcast| F[AOC Platform Frontend<br/>103.13.30.191]
    
    G[81GB Ambulance Images] --> C
    
    style B fill:#90EE90
    style C fill:#87CEEB
    style D fill:#FFB6C1
    style E fill:#FFB6C1
```

### **Data Flow**
```
15 Ambulance Boxes → API Server (117.18.126.118) → New Docker Database → WebSocket Broadcast → AOC Platform Frontend
```

---

## 🏗️ Docker Database System Architecture

### **Database-Only Container Setup**
```yaml
version: '3.8'
services:
  aocv2-mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./mongodb-init:/docker-entrypoint-initdb.d
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=ThaiAocV21
      - MONGO_INITDB_DATABASE=aoc_v2
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3

  aocv2-redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --requirepass aocv2@123!
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  aocv2-images:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./ambulance_images:/usr/share/nginx/html
    restart: unless-stopped

volumes:
  mongodb_data:
    driver: local
  redis_data:
    driver: local
```

---

## 📋 Implementation Steps

### **Phase 1: Create Docker Database System**

#### 1. **MongoDB Initialization Script**
```javascript
// mongodb-init/init.js
db = db.getSiblingDB('aoc_v2');

// Create collections
db.createCollection('ambulances');
db.createCollection('ambulance_trackings');
db.createCollection('ambulance_tracking_histories');
db.createCollection('ambulance_images');
db.createCollection('ambulance_image_histories');
db.createCollection('ambulance_crashes');
db.createCollection('aoc_requests');

// Create indexes for performance
db.ambulance_trackings.createIndex({ "ambulance_id": 1 });
db.ambulance_trackings.createIndex({ "count_datetime": 1 });
db.ambulance_tracking_histories.createIndex({ "ambulance_id": 1 });
db.ambulance_tracking_histories.createIndex({ "count_datetime": 1 });
db.ambulance_images.createIndex({ "ambulance_id": 1 });
db.ambulance_images.createIndex({ "createdAt": 1 });
db.ambulance_crashes.createIndex({ "ambulance_id": 1 });
db.ambulance_crashes.createIndex({ "count_datetime": 1 });

print('Database initialization completed');
```

#### 2. **Environment Configuration for API Server**
```bash
# Update .env on API Server (117.18.126.118)
NODE_ENV=LIVE
SOCKET_SERVER_PORT=5050

# Database Configuration (Point to new Docker system)
LIVE_DB_USER=admin
LIVE_DB_USER_PSW=ThaiAocV21
LIVE_DB_HOST=117.18.126.118  # Same server, different port
LIVE_DB_HOST_PORT=27017
LIVE_DB=aoc_v2
LIVE_AUTH_DB=admin

# Redis Configuration (Point to new Docker system)
LIVE_REDIS_HOST=117.18.126.118  # Same server, different port
LIVE_REDIS_PORT=6379
LIVE_REDIS_PASSWORD=aocv2@123!

# MongoDB Connection String (Point to new Docker system)
MONGODB_LIVE_URL=mongodb://admin:ThaiAocV21%40@117.18.126.118:27017/aoc_v2?authSource=admin

# External Services (Keep same)
GOOGLE_MAP_KEY=AIzaSyAIOJRDeFlwPICCvcabVmjoscJgVzs63Ls
FCM_SERVER_KEY=AAAA8uxbopM:APA91bFF8t6ItmNKC6QD9FlWgWKpKLYHFA5tpwiq3MxbcpmMMx14PnFTDDzhlxmbzzdniLTya6k6El_bvnGftpZ3Q3dDpA_g2EEpfnb_VF2uMeqlhvLESrKNdvhWgpb9Wm14GvsPngZy
```

#### 3. **Data Migration Script**
```bash
#!/bin/bash
# migrate-data.sh

echo "Starting data migration from old database to new Docker database..."

# Export data from old database (117.18.126.117)
mongodump --host 117.18.126.117:27017 --username admin --password ThaiAocV21 --authenticationDatabase admin --db aoc_v2 --out ./backup

# Import data to new Docker database (117.18.126.118)
mongorestore --host 117.18.126.118:27017 --username admin --password ThaiAocV21 --authenticationDatabase admin --db aoc_v2 ./backup/aoc_v2

echo "Data migration completed!"
```

---

## 🔄 Migration Strategy

### **Zero-Downtime Database Migration**
1. **Deploy Docker Database System** alongside current system
2. **Migrate Data** from old database to new Docker database
3. **Update API Server Configuration** to point to new database
4. **Test Data Consistency** and performance
5. **Decommission Old Database** after verification

### **Migration Steps**
```bash
# 1. Deploy new Docker database system
docker-compose up -d

# 2. Wait for containers to be healthy
docker-compose ps

# 3. Migrate data from old database
./migrate-data.sh

# 4. Update API server configuration
# Edit .env file on 117.18.126.118

# 5. Restart API server to use new database
pm2 restart tracking

# 6. Test data flow
# Check if ambulance boxes can still POST data
# Check if AOC Platform Frontend receives data

# 7. Verify data consistency
# Compare data between old and new databases

# 8. Decommission old database
# Stop services on 117.18.126.117
```

---

## 📊 Expected Benefits

### **Database Replacement Benefits**
- **Better Performance**: Docker-optimized MongoDB and Redis
- **Easier Management**: Container-based database administration
- **Better Monitoring**: Container health checks and metrics
- **Easier Scaling**: Horizontal scaling capabilities
- **Backup/Restore**: Simplified data backup and recovery

### **System Stability**
- **Keep Current API Server**: No changes to working API endpoints
- **Same Data Format**: GPS/Image/Crash data structure preserved
- **Same WebSocket**: AOC Platform Frontend receives same data format
- **Same Storage**: 81GB ambulance images preserved

---

## 🚀 Implementation Commands

### **Setup Docker Database System**
```bash
# 1. Create new directory
mkdir aocv2-docker-database
cd aocv2-docker-database

# 2. Create Docker files
# (docker-compose.yml, mongodb-init/init.js, migrate-data.sh)

# 3. Deploy database system
docker-compose up -d

# 4. Check status
docker-compose ps
docker-compose logs -f aocv2-mongodb
docker-compose logs -f aocv2-redis

# 5. Test database connections
mongosh --host 117.18.126.118:27017 --username admin --password ThaiAocV21 --authenticationDatabase admin
redis-cli -h 117.18.126.118 -p 6379 -a aocv2@123!
```

### **Test Data Flow**
```bash
# Test API server connection to new database
curl -X POST http://117.18.126.118:5000/api/tracking/postAmbulanceTracking \
  -H "Content-Type: application/json" \
  -d '{
    "ambulance_id": "332",
    "tracking_latitude": 13.7563,
    "tracking_longitude": 100.5018,
    "tracking_speed": 45.5,
    "tracking_heading": 180
  }'

# Check WebSocket connection
curl http://117.18.126.118:5050/

# Verify data in new database
mongosh --host 117.18.126.118:27017 --username admin --password ThaiAocV21 --authenticationDatabase admin --eval "db.ambulance_trackings.find().limit(5)"
```

---

## ❓ Ready to Implement?

**Yes! We can create the Docker database system to replace the current database server.**

The new system will:
- ✅ **Keep current API server** (117.18.126.118) unchanged
- ✅ **Replace database server** (117.18.126.117) with Docker containers
- ✅ **Maintain same data flow** (15 Ambulance Boxes → API Server → New Database → WebSocket → AOC Platform Frontend)
- ✅ **Preserve 81GB ambulance images** storage
- ✅ **Improve database performance** and management

### **What would you like me to create first?**

1. **docker-compose.yml** for MongoDB + Redis containers?
2. **MongoDB initialization script** for database setup?
3. **Data migration script** to move data from old to new database?
4. **Environment configuration** for API server to use new database?
5. **Migration strategy** for zero-downtime database replacement?

The new Docker database system will run on the same server (117.18.126.118) but replace the external database server (117.18.126.117) with containerized MongoDB and Redis.

---

**Document Version:** 1.0  
**Last Updated:** September 10, 2025  
**Status:** Ready for Database Replacement Implementation  
**Next Action:** Awaiting user direction for specific implementation steps
