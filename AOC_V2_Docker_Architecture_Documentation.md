# AOC V2 Docker Architecture Documentation

## 🎯 Architecture Overview
The AOC V2 Tracking System has been successfully migrated from a PM2-based deployment to a modern Docker containerized architecture, providing improved scalability, maintainability, and operational efficiency.

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        AOC V2 Docker System                    │
│                     Server: 103.22.182.145                     │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐    ┌─────────▼─────────┐    ┌───────▼────────┐
│   External     │    │   Load Balancer    │    │   Monitoring   │
│   Clients      │    │     (Nginx)        │    │  (Prometheus)  │
│                │    │   Ports 80/443     │    │   Port 9090    │
└────────────────┘    └────────────────────┘    └────────────────┘
        │                       │                       │
        │                       │                       │
        │              ┌────────▼────────┐             │
        │              │   Application   │             │
        │              │     Layer       │             │
        │              └─────────────────┘             │
        │                       │                       │
        │              ┌────────▼────────┐             │
        │              │   Data Layer    │             │
        │              │                 │             │
        │              └─────────────────┘             │
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Infrastructure      │
                    │      Layer            │
                    └───────────────────────┘
```

## 🐳 Container Architecture

### Service Layer Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Compose Services                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Server    │    │ WebSocket Server│    │   Monitor       │
│  aocv2-api      │    │ aocv2-websocket │    │  aocv2-monitor  │
│   Port 3000     │    │ Ports 7000/7001 │    │   Port 3001     │
│                 │    │                 │    │                 │
│ • REST API      │    │ • Real-time     │    │ • Health        │
│ • GPS Tracking  │    │   Events        │    │   Monitoring    │
│ • Image Upload  │    │ • TCP Server    │    │ • Metrics       │
│ • Data Processing│    │ • Socket.IO     │    │ • Alerts       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Data Services       │
                    └──────────────────────────┘
                                 │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐    ┌─────────▼─────────┐    ┌───────▼────────┐
│   MongoDB      │    │      Redis        │    │   P1 Server   │
│ aocv2-mongodb  │    │   aocv2-redis     │    │   aocv2-p1   │
│   Port 27017   │    │    Port 6379      │    │   Port 3002   │
│                │    │                   │    │               │
│ • Primary DB   │    │ • Session Store   │    │ • P1 Protocol│
│ • 7.29 GiB    │    │ • Cache Layer     │    │ • Data Relay  │
│ • 56.7M docs  │    │ • Auth Tokens     │    │ • Processing  │
└────────────────┘    └───────────────────┘    └───────────────┘
```

### Infrastructure Layer
```
┌─────────────────────────────────────────────────────────────────┐
│                   Infrastructure Services                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   Prometheus    │    │   File Storage  │
│  aocv2-nginx    │    │ aocv2-monitoring│    │   Volumes       │
│  Ports 80/443    │    │   Port 9090     │    │                 │
│                 │    │                 │    │ • MongoDB Data  │
│ • Reverse Proxy │    │ • Metrics       │    │ • Redis Data    │
│ • Load Balancer │    │ • Monitoring    │    │ • Image Storage │
│ • SSL Termination│    │ • Alerting      │    │ • Logs         │
│ • Static Files  │    │ • Dashboards    │    │ • Backups      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 Data Flow Architecture

### Real-time Data Processing Flow
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ambulance     │    │   API Server    │    │   MongoDB       │
│   Devices       │    │  aocv2-api      │    │ aocv2-mongodb   │
│                 │    │                 │    │                 │
│ • GPS Data      │───▶│ • HTTP POST     │───▶│ • Data Storage  │
│ • Images        │    │ • Validation    │    │ • Indexing      │
│ • Status        │    │ • Processing    │    │ • Persistence   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │     Redis       │    │   Monitoring    │
│ aocv2-websocket │    │  aocv2-redis    │    │ aocv2-monitoring│
│                 │    │                 │    │                 │
│ • Real-time     │◀───│ • Session Mgmt  │◀───│ • Metrics       │
│ • Broadcasting  │    │ • Cache         │    │ • Health Checks │
│ • Client Mgmt   │    │ • Auth Tokens   │    │ • Alerting      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Request Processing Flow
```
Client Request → Nginx → API Server → Database → Response → Client
      │            │         │           │         │         │
      │            │         │           │         │         │
   HTTP/HTTPS   Load      Process     Store    Format   Real-time
   Port 80/443  Balance   Validate    Data     Response  Update
```

## 🌐 Network Architecture

### Docker Network Configuration
```yaml
networks:
  aocv2-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Port Mapping
| Service | Internal Port | External Port | Protocol | Purpose |
|---------|---------------|---------------|----------|---------|
| **API Server** | 3000 | 3000 | HTTP | REST API |
| **WebSocket TCP** | 7000 | 7000 | TCP | TCP Server |
| **WebSocket HTTP** | 7001 | 7001 | HTTP | WebSocket |
| **Monitor** | 3001 | 3001 | HTTP | Monitoring |
| **P1 Server** | 3002 | 3002 | HTTP | P1 Protocol |
| **MongoDB** | 27017 | 27017 | TCP | Database |
| **Redis** | 6379 | 6379 | TCP | Cache/Sessions |
| **Nginx HTTP** | 80 | 80 | HTTP | Web Server |
| **Nginx HTTPS** | 443 | 443 | HTTPS | Secure Web |
| **Prometheus** | 9090 | 9090 | HTTP | Monitoring |

### Service Communication
```
┌─────────────────────────────────────────────────────────────────┐
│                    Internal Service Communication               │
└─────────────────────────────────────────────────────────────────┘

aocv2-api ──────────────┐
                        │
                        ├───► aocv2-mongodb:27017
                        │
                        ├───► aocv2-redis:6379
                        │
aocv2-websocket ────────┤
                        │
aocv2-monitor ──────────┤
                        │
aocv2-p1 ───────────────┤
                        │
aocv2-nginx ────────────┼───► aocv2-api:3000
                        │
                        ├───► aocv2-websocket:7001
                        │
aocv2-monitoring ───────┼───► All Services (Metrics)
                        │
                        └───► External Clients
```

## 💾 Storage Architecture

### Volume Configuration
```yaml
volumes:
  aocv2-mongodb_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /www/samserver-docker/data/mongodb
  
  aocv2-redis_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /www/samserver-docker/data/redis
  
  aocv2-prometheus_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /www/samserver-docker/data/prometheus
```

### Storage Layout
```
/www/samserver-docker/
├── data/
│   ├── mongodb/          # MongoDB data files
│   ├── redis/            # Redis data files
│   └── prometheus/       # Prometheus metrics
├── logs/
│   ├── api/              # API server logs
│   ├── websocket/        # WebSocket logs
│   ├── monitor/          # Monitor logs
│   └── p1/               # P1 server logs
├── ambulance_images/     # Image storage
├── backup/               # Database backups
└── config/               # Configuration files
```

## 🔐 Security Architecture

### Container Security Model
```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Layers                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Network       │    │   Container     │    │   Application   │
│   Security      │    │   Security      │    │   Security      │
│                 │    │                 │    │                 │
│ • Firewall      │    │ • Non-root      │    │ • Authentication│
│ • Port Control  │    │ • Resource      │    │ • Authorization │
│ • SSL/TLS       │    │   Limits        │    │ • Input         │
│ • Access Lists  │    │ • Health Checks │    │   Validation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Authentication Flow
```
Client → Nginx → API Server → Redis (Session) → MongoDB (User Data)
   │        │         │            │                    │
   │        │         │            │                    │
Token   SSL/TLS   JWT Token   Session Store        User Database
Check   Termination  Validation   Cache            Authentication
```

## 📊 Monitoring Architecture

### Monitoring Stack
```
┌─────────────────────────────────────────────────────────────────┐
│                    Monitoring Architecture                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Infrastructure│    │   Business       │
│   Metrics       │    │   Metrics       │    │   Metrics        │
│                 │    │                 │    │                 │
│ • API Response  │    │ • CPU Usage     │    │ • Active        │
│ • Error Rates   │    │ • Memory Usage  │    │   Ambulances    │
│ • Throughput    │    │ • Disk Usage    │    │ • Request       │
│ • Latency       │    │ • Network I/O   │    │   Volume        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Prometheus           │
                    │  aocv2-monitoring        │
                    │                         │
                    │ • Metrics Collection    │
                    │ • Data Storage          │
                    │ • Query Engine         │
                    │ • Alerting Rules       │
                    └─────────────────────────┘
```

## 🔄 Deployment Architecture

### CI/CD Pipeline (Future)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │   Testing       │    │   Production    │
│   Environment   │    │   Environment   │    │   Environment   │
│                 │    │                 │    │                 │
│ • Code Changes  │    │ • Automated     │    │ • Blue-Green    │
│ • Local Testing │    │   Testing       │    │   Deployment    │
│ • Unit Tests    │    │ • Integration   │    │ • Health Checks │
│ • Code Review   │    │   Tests         │    │ • Rollback      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Git Repository      │
                    │                         │
                    │ • Version Control       │
                    │ • Branch Management     │
                    │ • Release Tags          │
                    │ • Documentation         │
                    └─────────────────────────┘
```

## 🚀 Scalability Architecture

### Horizontal Scaling
```
┌─────────────────────────────────────────────────────────────────┐
│                    Scalability Model                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load          │    │   Multiple      │    │   Database      │
│   Balancer      │    │   API Instances │    │   Clustering    │
│                 │    │                 │    │                 │
│ • Nginx         │    │ • aocv2-api-1   │    │ • MongoDB       │
│ • Round Robin   │    │ • aocv2-api-2   │    │   Replica Set   │
│ • Health Checks │    │ • aocv2-api-3   │    │ • Redis Cluster │
│ • SSL Offload   │    │ • Auto Scaling  │    │ • Sharding      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Vertical Scaling
- **CPU**: Increase container CPU limits
- **Memory**: Increase container memory limits
- **Storage**: Add more disk space for volumes
- **Network**: Increase bandwidth allocation

## 🔧 Configuration Management

### Environment Configuration
```bash
# Production Environment
ENVIRONMENT=LIVE
NODE_ENV=production

# Database Configuration
MONGODB_LIVE_URL=mongodb://admin:password@aocv2-mongodb:27017/aoc_v2?authSource=admin
LIVE_REDIS_HOST=aocv2-redis
LIVE_REDIS_PORT=6379
LIVE_REDIS_PASSWORD=aocv2@123!

# Service Configuration
API_PORT=3000
WEBSOCKET_TCP_PORT=7000
WEBSOCKET_HTTP_PORT=7001
```

### Container Configuration
- **Resource Limits**: CPU and memory constraints
- **Health Checks**: Container health monitoring
- **Restart Policies**: Automatic restart on failure
- **Logging**: Centralized log management

## 📈 Performance Architecture

### Performance Optimization
```
┌─────────────────────────────────────────────────────────────────┐
│                    Performance Layers                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Database      │    │   Network       │
│   Layer         │    │   Layer         │    │   Layer         │
│                 │    │                 │    │                 │
│ • Connection    │    │ • Indexing      │    │ • Compression   │
│   Pooling       │    │ • Query         │    │ • Caching       │
│ • Caching       │    │   Optimization  │    │ • CDN           │
│ • Async         │    │ • Replication   │    │ • Load          │
│   Processing    │    │ • Sharding      │    │   Balancing     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Architecture Benefits

### Advantages of Docker Architecture
1. **Isolation**: Each service runs in its own container
2. **Scalability**: Easy horizontal and vertical scaling
3. **Portability**: Consistent deployment across environments
4. **Maintainability**: Simplified service management
5. **Resource Efficiency**: Optimized resource utilization
6. **Security**: Container-based security isolation
7. **Monitoring**: Comprehensive health checks and metrics
8. **Backup**: Simplified backup and recovery procedures

### Migration Benefits
- **Modern Stack**: Latest container technologies
- **Improved Reliability**: Better error handling and recovery
- **Enhanced Monitoring**: Comprehensive metrics and alerting
- **Simplified Operations**: Docker-based management
- **Better Security**: Container isolation and security
- **Easier Scaling**: Container orchestration capabilities

---

## 📞 Architecture Support

### Documentation
- **Deployment Guide**: Complete deployment procedures
- **Configuration**: Service configuration details
- **Monitoring**: Monitoring and alerting setup
- **Troubleshooting**: Common issues and solutions

### Contact Information
- **System Administrator**: root@103.22.182.145:2222
- **Architecture Documentation**: This document
- **Last Updated**: September 10, 2025

---

**🎉 AOC V2 Docker Architecture Fully Documented!**

*This comprehensive architecture documentation provides complete understanding of the containerized AOC V2 tracking system design and implementation.*
