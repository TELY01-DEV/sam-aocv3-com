# AOC V2 Docker Implementation Plan

## 🎯 Implementation Readiness Assessment

Based on our comprehensive analysis, we are **READY** to implement the new Samserver with Docker. Here's what we know:

### ✅ **Current System Analysis Complete**
- **16 Ambulance Boxes** actively POSTing data
- **1 AOC Platform Frontend** receiving real-time data
- **81GB ambulance images** storage requirement
- **PM2 with 314 restarts** indicating stability issues
- **Real-time WebSocket** communication requirements
- **MongoDB + Redis** database dependencies

### ✅ **Docker Migration Benefits Identified**
- **Better Stability**: Eliminate PM2 restart issues
- **Horizontal Scaling**: Handle more ambulance boxes
- **Automated Deployment**: CI/CD pipeline ready
- **Advanced Monitoring**: Container health checks
- **Environment Consistency**: Dev/Staging/Production parity

---

## 🏗️ Docker Architecture Design

### **Multi-Container Setup**
```mermaid
graph TD
    A[Nginx Proxy] --> B[Node.js App Container]
    B --> C[MongoDB Container]
    B --> D[Redis Container]
    E[Ambulance Images Volume] --> B
    F[WebSocket Server] --> G[AOC Platform Frontend]
    
    H[16 Ambulance Boxes] --> A
    A --> B
    B --> F
```

### **Container Services**
1. **aocv2-app**: Node.js application + WebSocket server
2. **aocv2-nginx**: Reverse proxy and load balancer
3. **aocv2-mongodb**: Database service (optional - can use external)
4. **aocv2-redis**: Cache and session management (optional - can use external)

---

## 📋 Implementation Steps

### **Phase 1: Docker Configuration Files**

#### 1. **Dockerfile** (Node.js Application)
```dockerfile
FROM node:21-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000 5050
CMD ["node", "server.js"]
```

#### 2. **docker-compose.yml** (Multi-Service Setup)
```yaml
version: '3.8'
services:
  aocv2-app:
    build: .
    ports:
      - "5000:5000"
      - "5050:5050"
    volumes:
      - ./ambulance_images:/app/public/uploads/ambulance_images
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - MONGODB_LIVE_URL=${MONGODB_LIVE_URL}
      - LIVE_REDIS_HOST=${LIVE_REDIS_HOST}
    depends_on:
      - aocv2-redis
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

  aocv2-redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
```

#### 3. **Nginx Configuration** (Docker-optimized)
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
    
    server {
        listen 80;
        server_name sam.aocv2.com;
        
        location / {
            proxy_pass http://aocv2_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location /ambulance_images/ {
            alias /var/www/ambulance_images/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    server {
        listen 80;
        server_name sam-gps.aocv2.com;
        
        location / {
            proxy_pass http://aocv2_websocket;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

### **Phase 2: Volume Management**

#### **Ambulance Images Volume**
```bash
# Create volume mapping for 81GB images
docker volume create aocv2_images
# Map to existing data: /home/samserver/aocv2trackingserver-master/public/uploads/ambulance_images
```

#### **Environment Variables**
```bash
# .env file
MONGODB_LIVE_URL=mongodb://admin:ThaiAocV21%40@117.18.126.117:27017/aoc_v2?authSource=admin
LIVE_REDIS_HOST=117.18.126.117
LIVE_REDIS_PORT=6379
LIVE_REDIS_PASSWORD=aocv2@123!
GOOGLE_MAP_KEY=AIzaSyAIOJRDeFlwPICCvcabVmjoscJgVzs63Ls
FCM_SERVER_KEY=AAAA8uxbopM:APA91bFF8t6ItmNKC6QD9FlWgWKpKLYHFA5tpwiq3MxbcpmMMx14PnFTDDzhlxmbzzdniLTya6k6El_bvnGftpZ3Q3dDpA_g2EEpfnb_VF2uMeqlhvLESrKNdvhWgpb9Wm14GvsPngZy
```

### **Phase 3: Migration Strategy**

#### **Blue-Green Deployment**
1. **Blue Environment**: Current PM2 system (117.18.126.118)
2. **Green Environment**: New Docker system (same server or new server)
3. **Zero Downtime**: Switch traffic gradually
4. **Rollback Plan**: Instant revert to PM2 if issues

#### **Migration Steps**
```bash
# 1. Prepare Docker environment
docker-compose up -d --build

# 2. Test with subset of ambulance boxes
# Redirect 2-3 ambulance boxes to Docker system

# 3. Monitor performance and stability
docker-compose logs -f aocv2-app

# 4. Gradual traffic migration
# Redirect more ambulance boxes as confidence builds

# 5. Full migration
# All 16 ambulance boxes + AOC Platform Frontend
```

---

## 🔧 Implementation Commands

### **Initial Setup**
```bash
# 1. Create Docker configuration files
mkdir aocv2-docker
cd aocv2-docker

# 2. Copy application code
cp -r ../aocv2trackingserver-master ./

# 3. Create Docker files
# (Dockerfile, docker-compose.yml, nginx.conf)

# 4. Build and start
docker-compose up -d --build
```

### **Monitoring Commands**
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f aocv2-app

# Monitor resource usage
docker stats

# Health checks
curl http://localhost:5000/
curl http://localhost:5050/
```

---

## 📊 Expected Benefits

### **Performance Improvements**
- **Stability**: Eliminate PM2 restart issues (314 restarts → 0)
- **Resource Management**: Better memory and CPU allocation
- **Scalability**: Easy horizontal scaling for more ambulance boxes
- **Monitoring**: Built-in health checks and metrics

### **Operational Benefits**
- **Deployment**: Automated CI/CD pipeline
- **Rollback**: Instant revert capability
- **Environment**: Consistent dev/staging/production
- **Maintenance**: Simplified updates and patches

---

## 🚀 Next Steps

### **Immediate Actions**
1. **Create Docker configuration files**
2. **Setup development environment**
3. **Test with subset of ambulance boxes**
4. **Implement monitoring and health checks**

### **Timeline**
- **Week 1**: Docker configuration and testing
- **Week 2**: Blue-green deployment setup
- **Week 3**: Gradual migration (2-3 ambulance boxes)
- **Week 4**: Full migration (all 16 ambulance boxes)

---

## ❓ Ready to Proceed?

**Yes, we are ready to implement!** 

Would you like me to:
1. **Create the actual Docker configuration files?**
2. **Start with a specific component (Dockerfile, docker-compose.yml, etc.)?**
3. **Set up the development environment first?**
4. **Begin with the migration strategy?**

The analysis is complete, the plan is ready, and we have all the information needed to successfully migrate from PM2 to Docker while maintaining zero downtime for your 16 active ambulance boxes.

---

**Document Version:** 1.0  
**Last Updated:** September 10, 2025  
**Status:** Ready for Implementation  
**Next Action:** Awaiting user direction for specific implementation steps
