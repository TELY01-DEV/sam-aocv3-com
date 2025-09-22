# AOC V2 Docker Migration Analysis

## Overview
This document provides a comprehensive analysis of migrating the AOC V2 Samserver from PM2 to Docker containerization, including benefits, challenges, implementation strategy, and detailed migration plan.

## Table of Contents
1. [Current PM2 Setup Analysis](#current-pm2-setup-analysis)
2. [Docker vs PM2 Comparison](#docker-vs-pm2-comparison)
3. [Migration Benefits](#migration-benefits)
4. [Migration Challenges](#migration-challenges)
5. [Docker Implementation Strategy](#docker-implementation-strategy)
6. [Detailed Migration Plan](#detailed-migration-plan)
7. [Docker Configuration Files](#docker-configuration-files)
8. [Migration Timeline](#migration-timeline)
9. [Risk Assessment](#risk-assessment)
10. [Recommendations](#recommendations)

---

## Current PM2 Setup Analysis

### Current System Architecture
```
PM2 Process Manager
├── tracking (PID: 3669021)
│   ├── Node.js Application (Port 5000)
│   ├── WebSocket Server (Port 5050)
│   ├── Memory Usage: 132.4MB
│   ├── CPU Usage: 0%
│   ├── Restart Count: 314
│   └── Uptime: 103+ minutes
```

### Current Dependencies
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "body-parser": "^1.20.1",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "debug": "^4.3.4",
    "express": "^4.18.2",
    "helmet": "^6.0.1",
    "http-errors": "^2.0.0",
    "jsonwebtoken": "^9.0.0",
    "mongoose": "^6.8.4",
    "morgan": "^1.10.0",
    "redis": "^4.6.5",
    "socket.io": "^4.6.1"
  }
}
```

### Current Performance Metrics
| Metric | Value | Status |
|--------|-------|--------|
| **HTTP Requests** | 24.56 req/min | ✅ Active |
| **HTTP P95 Latency** | 4ms | ✅ Excellent |
| **HTTP Mean Latency** | 1ms | ✅ Excellent |
| **Memory Usage** | 132.4MB | ✅ Stable |
| **Heap Usage** | 56.46% | ✅ Normal |
| **Event Loop Latency** | 0.14ms | ✅ Excellent |
| **Active Handles** | 28 | ✅ Normal |

### Current Issues
- **High Restart Count**: 314 restarts indicate instability
- **Manual Management**: PM2 requires manual intervention
- **Environment Dependencies**: Tied to specific server environment
- **Scaling Limitations**: Difficult to scale horizontally

---

## Docker vs PM2 Comparison

### Feature Comparison
| Feature | PM2 | Docker |
|---------|-----|--------|
| **Process Management** | ✅ Built-in | ✅ Built-in |
| **Auto Restart** | ✅ Yes | ✅ Yes |
| **Log Management** | ✅ Built-in | ✅ Built-in |
| **Environment Isolation** | ❌ Limited | ✅ Complete |
| **Dependency Management** | ❌ System-wide | ✅ Containerized |
| **Scaling** | ❌ Vertical only | ✅ Horizontal + Vertical |
| **Portability** | ❌ Server-specific | ✅ Any platform |
| **Resource Limits** | ❌ Basic | ✅ Advanced |
| **Health Checks** | ❌ Basic | ✅ Advanced |
| **Rolling Updates** | ❌ Manual | ✅ Automated |
| **Backup/Restore** | ❌ Complex | ✅ Simple |

### Resource Usage Comparison
| Resource | PM2 Current | Docker Estimated |
|----------|-------------|-----------------|
| **Memory** | 132.4MB | ~150MB (with overhead) |
| **CPU** | 0% (idle) | ~5% (container overhead) |
| **Disk** | 82GB (images) | 82GB + ~500MB (containers) |
| **Network** | Direct ports | Port mapping |

---

## Migration Benefits

### 🚀 **Operational Benefits**

#### **1. Environment Consistency**
- **Current**: Server-specific configuration
- **Docker**: Identical environment across dev/staging/production
- **Benefit**: Eliminates "works on my machine" issues

#### **2. Simplified Deployment**
- **Current**: Manual server setup, dependency installation
- **Docker**: Single command deployment
- **Benefit**: Faster, more reliable deployments

#### **3. Better Resource Management**
- **Current**: No resource limits, potential memory leaks
- **Docker**: CPU/memory limits, automatic cleanup
- **Benefit**: Better system stability

#### **4. Enhanced Monitoring**
- **Current**: Basic PM2 monitoring
- **Docker**: Advanced health checks, metrics
- **Benefit**: Better observability

### 🔧 **Technical Benefits**

#### **1. Horizontal Scaling**
- **Current**: Single instance, vertical scaling only
- **Docker**: Multiple containers, load balancing
- **Benefit**: Better performance under load

#### **2. Zero-Downtime Deployments**
- **Current**: Service restart required
- **Docker**: Rolling updates, blue-green deployments
- **Benefit**: No service interruption

#### **3. Dependency Isolation**
- **Current**: System-wide Node.js dependencies
- **Docker**: Containerized dependencies
- **Benefit**: No version conflicts

#### **4. Backup & Recovery**
- **Current**: Complex file-based backups
- **Docker**: Container images, simple restore
- **Benefit**: Faster disaster recovery

---

## Migration Challenges

### ⚠️ **Technical Challenges**

#### **1. Large File Storage**
- **Challenge**: 82GB ambulance images
- **Impact**: Container size, storage management
- **Solution**: External volume mounting

#### **2. Database Connections**
- **Challenge**: External MongoDB/Redis connections
- **Impact**: Network configuration complexity
- **Solution**: Environment variable configuration

#### **3. SSL Certificates**
- **Challenge**: Certificate management in containers
- **Impact**: HTTPS configuration complexity
- **Solution**: Volume mounting or certificate injection

#### **4. WebSocket Connections**
- **Challenge**: Real-time connection management
- **Impact**: Connection stability during updates
- **Solution**: Sticky sessions or connection pooling

### 🔄 **Migration Challenges**

#### **1. Zero-Downtime Migration**
- **Challenge**: Migrating without service interruption
- **Impact**: Service availability
- **Solution**: Blue-green deployment strategy

#### **2. Data Consistency**
- **Challenge**: Ensuring no data loss during migration
- **Impact**: Data integrity
- **Solution**: Comprehensive backup and validation

#### **3. Configuration Migration**
- **Challenge**: Moving PM2 configs to Docker
- **Impact**: Service behavior changes
- **Solution**: Careful configuration mapping

---

## Docker Implementation Strategy

### 🏗️ **Architecture Design**

#### **Multi-Container Setup**
```
Docker Compose Stack
├── aocv2-app (Main Application)
│   ├── Port: 5000 (HTTP API)
│   ├── Port: 5050 (WebSocket)
│   └── Volume: /app/uploads (Images)
├── nginx (Reverse Proxy)
│   ├── Port: 80 (HTTP)
│   ├── Port: 443 (HTTPS)
│   └── SSL: Let's Encrypt
├── redis (Optional - Local)
│   └── Port: 6379
└── volumes
    ├── ambulance-images (82GB)
    ├── ssl-certs
    └── app-data
```

#### **Container Strategy**
1. **Single Container**: Main app + WebSocket in one container
2. **Separate Containers**: App and WebSocket in different containers
3. **Microservices**: Split into multiple specialized containers

### 📋 **Recommended Approach: Single Container**

**Rationale:**
- Simpler deployment and management
- Maintains current architecture
- Easier migration from PM2
- Single point of configuration

---

## Detailed Migration Plan

### 🎯 **Phase 1: Preparation (Week 1)**

#### **1.1 Environment Analysis**
```bash
# Document current environment
pm2 show tracking
pm2 env 0
cat .env
```

#### **1.2 Docker Environment Setup**
```bash
# Install Docker and Docker Compose
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl enable docker
sudo usermod -aG docker samserver
```

#### **1.3 Create Docker Configuration**
- Create Dockerfile
- Create docker-compose.yml
- Create .dockerignore
- Test container build

### 🎯 **Phase 2: Development (Week 2)**

#### **2.1 Container Development**
```bash
# Build and test container
docker build -t aocv2-app .
docker run -d --name aocv2-test -p 5000:5000 -p 5050:5050 aocv2-app
```

#### **2.2 Volume Configuration**
```bash
# Setup external volumes
docker volume create aocv2-images
docker volume create aocv2-data
```

#### **2.3 Environment Configuration**
- Migrate .env to Docker environment
- Configure external database connections
- Setup SSL certificate mounting

### 🎯 **Phase 3: Testing (Week 3)**

#### **3.1 Parallel Testing**
- Run Docker container alongside PM2
- Compare performance metrics
- Test all API endpoints
- Validate WebSocket functionality

#### **3.2 Load Testing**
- Test with production-like load
- Monitor resource usage
- Validate scaling capabilities
- Test failover scenarios

### 🎯 **Phase 4: Migration (Week 4)**

#### **4.1 Blue-Green Deployment**
```bash
# Deploy new container
docker-compose up -d

# Update Nginx configuration
# Point to new container

# Monitor and validate
# Switch traffic gradually
```

#### **4.2 PM2 Decommissioning**
```bash
# Stop PM2 process
pm2 stop tracking
pm2 delete tracking

# Cleanup PM2 files
rm -rf ~/.pm2
```

---

## Docker Configuration Files

### 📄 **Dockerfile**
```dockerfile
# Use official Node.js runtime
FROM node:21.7.3-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p public/uploads/ambulance_images

# Expose ports
EXPOSE 5000 5050

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/ || exit 1

# Start application
CMD ["npm", "start"]
```

### 📄 **docker-compose.yml**
```yaml
version: '3.8'

services:
  aocv2-app:
    build: .
    container_name: aocv2-app
    restart: unless-stopped
    ports:
      - "5000:5000"
      - "5050:5050"
    environment:
      - NODE_ENV=production
      - ENVIRONMENT=LIVE
      - SOCKET_SERVER_PORT=5050
      - MONGODB_LIVE_URL=${MONGODB_LIVE_URL}
      - LIVE_REDIS_HOST=${LIVE_REDIS_HOST}
      - LIVE_REDIS_PORT=${LIVE_REDIS_PORT}
      - LIVE_REDIS_PASSWORD=${LIVE_REDIS_PASSWORD}
      - GOOGLE_MAP_KEY=${GOOGLE_MAP_KEY}
      - FCM_SERVER_KEY=${FCM_SERVER_KEY}
    volumes:
      - ambulance-images:/app/public/uploads/ambulance_images
      - ./ssl-certs:/app/ssl-certs:ro
    networks:
      - aocv2-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: aocv2-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl-certs:/etc/nginx/ssl:ro
      - ambulance-images:/var/www/images:ro
    depends_on:
      - aocv2-app
    networks:
      - aocv2-network

volumes:
  ambulance-images:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /home/samserver/aocv2trackingserver-master/public/uploads/ambulance_images

networks:
  aocv2-network:
    driver: bridge
```

### 📄 **nginx.conf**
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
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    server {
        listen 80;
        server_name sam-gps.aocv2.com;
        
        location / {
            proxy_pass http://aocv2_websocket;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 📄 **.dockerignore**
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.pm2
*.log
```

---

## Migration Timeline

### 📅 **4-Week Migration Plan**

#### **Week 1: Preparation**
- **Days 1-2**: Environment analysis and documentation
- **Days 3-4**: Docker setup and initial configuration
- **Days 5-7**: Create Docker files and test builds

#### **Week 2: Development**
- **Days 1-3**: Container development and testing
- **Days 4-5**: Volume and environment configuration
- **Days 6-7**: Integration testing

#### **Week 3: Testing**
- **Days 1-3**: Parallel testing with PM2
- **Days 4-5**: Load testing and performance validation
- **Days 6-7**: Security and SSL testing

#### **Week 4: Migration**
- **Days 1-2**: Blue-green deployment preparation
- **Days 3-4**: Gradual traffic migration
- **Days 5-7**: PM2 decommissioning and cleanup

---

## Risk Assessment

### 🚨 **High Risk Items**

#### **1. Data Loss Risk**
- **Risk**: Loss of 82GB ambulance images
- **Mitigation**: Comprehensive backup before migration
- **Probability**: Low
- **Impact**: High

#### **2. Service Downtime**
- **Risk**: Extended service interruption
- **Mitigation**: Blue-green deployment strategy
- **Probability**: Medium
- **Impact**: High

#### **3. Performance Degradation**
- **Risk**: Container overhead affecting performance
- **Mitigation**: Thorough load testing
- **Probability**: Low
- **Impact**: Medium

### ⚠️ **Medium Risk Items**

#### **4. Configuration Issues**
- **Risk**: Environment variable misconfiguration
- **Mitigation**: Careful configuration mapping
- **Probability**: Medium
- **Impact**: Medium

#### **5. SSL Certificate Issues**
- **Risk**: HTTPS configuration problems
- **Mitigation**: Certificate testing and validation
- **Probability**: Medium
- **Impact**: Medium

---

## Recommendations

### ✅ **Recommended Approach**

#### **1. Gradual Migration**
- Start with development environment
- Test thoroughly before production
- Use blue-green deployment
- Maintain rollback capability

#### **2. Resource Planning**
- Allocate additional 20% resources for container overhead
- Plan for volume storage requirements
- Consider backup storage needs

#### **3. Monitoring Setup**
- Implement comprehensive monitoring
- Set up alerting for container health
- Monitor performance metrics
- Track resource usage

#### **4. Documentation**
- Document all configuration changes
- Create operational runbooks
- Train team on Docker management
- Maintain migration documentation

### 🎯 **Success Criteria**

#### **Performance Metrics**
- Response time ≤ current performance
- Memory usage ≤ 150MB
- Zero data loss
- 99.9% uptime during migration

#### **Operational Metrics**
- Deployment time ≤ 5 minutes
- Rollback time ≤ 2 minutes
- Monitoring coverage 100%
- Documentation completeness 100%

---

## Conclusion

### 🎯 **Migration Decision Matrix**

| Factor | PM2 (Current) | Docker (Proposed) | Winner |
|--------|---------------|-------------------|--------|
| **Stability** | ⚠️ High restart count | ✅ Better isolation | Docker |
| **Scalability** | ❌ Limited | ✅ Horizontal scaling | Docker |
| **Deployment** | ⚠️ Manual | ✅ Automated | Docker |
| **Monitoring** | ⚠️ Basic | ✅ Advanced | Docker |
| **Resource Usage** | ✅ Lower overhead | ⚠️ Container overhead | PM2 |
| **Complexity** | ✅ Simple | ⚠️ More complex | PM2 |
| **Future-Proof** | ⚠️ Limited | ✅ Industry standard | Docker |

### 🚀 **Final Recommendation: PROCEED WITH DOCKER MIGRATION**

**Rationale:**
1. **Current Issues**: High restart count (314) indicates PM2 stability issues
2. **Future Benefits**: Better scalability, monitoring, and deployment capabilities
3. **Industry Trend**: Docker is the standard for modern applications
4. **Risk Mitigation**: Comprehensive plan with rollback capability

**Next Steps:**
1. **Approve Migration Plan**: Get stakeholder approval
2. **Resource Allocation**: Assign team and timeline
3. **Environment Setup**: Prepare Docker environment
4. **Begin Phase 1**: Start preparation phase

---

**Document Version:** 1.0  
**Last Updated:** September 10, 2025  
**Server:** 117.18.126.118:2222  
**Environment:** Production (LIVE)  
**Migration Status:** Proposed
