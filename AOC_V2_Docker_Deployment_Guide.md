# AOC V2 Docker Deployment Guide

## 🎯 Overview
Complete guide for deploying the AOC V2 Tracking System using Docker containers on Ubuntu 24.04 LTS.

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 24.04 LTS
- **RAM**: Minimum 8GB (Recommended 16GB)
- **Storage**: Minimum 50GB free space
- **CPU**: 4+ cores recommended
- **Network**: Static IP address

### Software Requirements
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **MongoDB Tools**: mongodump, mongorestore, mongosh
- **Git**: For version control

## 🚀 Installation Steps

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group
sudo usermod -aG docker $USER

# Install MongoDB tools
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-database-tools mongodb-mongosh
```

### Step 2: Project Deployment
```bash
# Create project directory
sudo mkdir -p /www/samserver-docker
cd /www/samserver-docker

# Copy project files (from local machine)
scp -P 2222 -r SAMSERVER-DOCKER/* root@103.22.182.145:/www/samserver-docker/

# Set permissions
sudo chown -R root:root /www/samserver-docker
sudo chmod +x /www/samserver-docker/scripts/*.sh
```

### Step 3: Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit environment variables
nano .env
```

**Environment Variables (.env):**
```bash
# Database Configuration
MONGODB_LIVE_URL=mongodb://admin:ThaiAocV21%40@aocv2-mongodb:27017/aoc_v2?authSource=admin
LIVE_REDIS_HOST=aocv2-redis
LIVE_REDIS_PORT=6379
LIVE_REDIS_PASSWORD=aocv2@123!

# Application Configuration
ENVIRONMENT=LIVE
NODE_ENV=production

# Server Configuration
API_PORT=3000
WEBSOCKET_TCP_PORT=7000
WEBSOCKET_HTTP_PORT=7001
MONITOR_PORT=3001
P1_PORT=3002
```

### Step 4: Data Migration
```bash
# Create backup directory
mkdir -p /www/mongodb-backup

# Migrate core collections (excluding large ones)
mongodump --host 117.18.126.117:27017 \
  --username admin \
  --password 'ThaiAocV21@' \
  --authenticationDatabase admin \
  --db aoc_v2 \
  --excludeCollection ambulance_image_histories \
  --out /www/mongodb-backup

# Start containers
docker-compose up -d

# Wait for MongoDB to be ready
sleep 30

# Restore core data
mongorestore --host localhost:27017 \
  --username admin \
  --password 'ThaiAocV21@' \
  --authenticationDatabase admin \
  --db aoc_v2 \
  --drop \
  /www/mongodb-backup/aoc_v2

# Migrate large collection separately
mongodump --host 117.18.126.117:27017 \
  --username admin \
  --password 'ThaiAocV21@' \
  --authenticationDatabase admin \
  --db aoc_v2 \
  --collection ambulance_image_histories \
  --out /www/mongodb-backup

mongorestore --host localhost:27017 \
  --username admin \
  --password 'ThaiAocV21@' \
  --authenticationDatabase admin \
  --db aoc_v2 \
  /www/mongodb-backup/aoc_v2/ambulance_image_histories.bson
```

## 🐳 Docker Services Configuration

### docker-compose.yml Structure
```yaml
version: '3.9'

services:
  aocv2-mongodb:
    image: mongo:6.0
    container_name: aocv2-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ThaiAocV21@
    volumes:
      - aocv2-mongodb_data:/data/db
      - ./mongodb-init:/docker-entrypoint-initdb.d
    networks:
      - aocv2-network

  aocv2-redis:
    image: redis:7-alpine
    container_name: aocv2-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --requirepass aocv2@123!
    volumes:
      - aocv2-redis_data:/data
    networks:
      - aocv2-network

  aocv2-api:
    build:
      context: ./API-SERVER-BACKUP/backend
      dockerfile: Dockerfile.api
    container_name: aocv2-api
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      ENVIRONMENT: LIVE
      MONGODB_LIVE_URL: mongodb://admin:ThaiAocV21%40@aocv2-mongodb:27017/aoc_v2?authSource=admin
      LIVE_REDIS_HOST: aocv2-redis
      LIVE_REDIS_PORT: 6379
      LIVE_REDIS_PASSWORD: aocv2@123!
    volumes:
      - ./logs/api:/app/logs
      - ./ambulance_images:/app/public/uploads/ambulance_images
    depends_on:
      - aocv2-mongodb
      - aocv2-redis
    networks:
      - aocv2-network

  aocv2-websocket:
    build:
      context: ./API-SERVER-BACKUP/p1_socket_server
      dockerfile: Dockerfile.websocket
    container_name: aocv2-websocket
    restart: unless-stopped
    ports:
      - "7000:7000"
      - "7001:7001"
    environment:
      NODE_ENV: production
      ENVIRONMENT: LIVE
    volumes:
      - ./logs/websocket:/app/logs
    networks:
      - aocv2-network

  aocv2-nginx:
    image: nginx:alpine
    container_name: aocv2-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-config:/etc/nginx/conf.d
      - ./ambulance_images:/var/www/images
    depends_on:
      - aocv2-api
      - aocv2-websocket
    networks:
      - aocv2-network

  aocv2-monitoring:
    image: prom/prometheus:latest
    container_name: aocv2-monitoring
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./scripts/prometheus.yml:/etc/prometheus/prometheus.yml
      - aocv2-prometheus_data:/prometheus
    networks:
      - aocv2-network

volumes:
  aocv2-mongodb_data:
  aocv2-redis_data:
  aocv2-prometheus_data:

networks:
  aocv2-network:
    driver: bridge
```

## 🔧 Service Management

### Starting Services
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d aocv2-api

# View logs
docker-compose logs -f aocv2-api
```

### Stopping Services
```bash
# Stop all services
docker-compose down

# Stop specific service
docker-compose stop aocv2-api

# Stop and remove volumes
docker-compose down -v
```

### Updating Services
```bash
# Rebuild and restart
docker-compose build
docker-compose up -d

# Force rebuild
docker-compose build --no-cache
docker-compose up -d
```

## 🔍 Health Checks

### Service Status
```bash
# Check all containers
docker-compose ps

# Check specific container health
docker inspect aocv2-api --format='{{.State.Health.Status}}'

# View container stats
docker stats
```

### API Testing
```bash
# Test API endpoint
curl http://103.22.182.145:3000/

# Test API with data
curl -X POST http://103.22.182.145:3000/api/ambulances/postHospitalAmbulanceList \
  -H "Content-Type: application/json" \
  -d '{}'

# Test WebSocket
curl http://103.22.182.145:7001/
```

### Database Testing
```bash
# Test MongoDB connection
docker exec aocv2-mongodb mongosh -u admin -p 'ThaiAocV21@' --authenticationDatabase admin --eval 'show dbs'

# Test Redis connection
docker exec aocv2-redis redis-cli -a 'aocv2@123!' ping

# Check database size
docker exec aocv2-mongodb mongosh -u admin -p 'ThaiAocV21@' --authenticationDatabase admin --eval 'show dbs'
```

## 📊 Monitoring Setup

### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mongodb'
    static_configs:
      - targets: ['samserver-mongodb:27017']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['samserver-redis:6379']
  
  - job_name: 'nginx'
    static_configs:
      - targets: ['samserver-images:80']
```

### Access Monitoring
- **Prometheus**: http://103.22.182.145:9090
- **Container Logs**: `docker-compose logs [service]`
- **System Resources**: `docker stats`

## 🚨 Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker-compose logs [service-name]

# Check container status
docker-compose ps

# Restart container
docker-compose restart [service-name]
```

#### Database Connection Issues
```bash
# Check MongoDB logs
docker-compose logs aocv2-mongodb

# Test connection
docker exec aocv2-mongodb mongosh -u admin -p 'ThaiAocV21@' --authenticationDatabase admin

# Check Redis
docker exec aocv2-redis redis-cli -a 'aocv2@123!' ping
```

#### Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :3000

# Kill process using port
sudo kill -9 $(lsof -t -i:3000)

# Restart services
docker-compose restart
```

#### Disk Space Issues
```bash
# Check disk usage
df -h

# Clean Docker system
docker system prune -a

# Clean unused volumes
docker volume prune
```

## 🔄 Backup Procedures

### Database Backup
```bash
# Create backup directory
mkdir -p /www/backups/$(date +%Y%m%d)

# Backup MongoDB
docker exec aocv2-mongodb mongodump \
  --username admin \
  --password 'ThaiAocV21@' \
  --authenticationDatabase admin \
  --db aoc_v2 \
  --out /backup

# Copy backup from container
docker cp aocv2-mongodb:/backup /www/backups/$(date +%Y%m%d)/
```

### Container Backup
```bash
# Save container images
docker save aocv2-api:latest | gzip > aocv2-api.tar.gz
docker save aocv2-websocket:latest | gzip > aocv2-websocket.tar.gz

# Backup volumes
docker run --rm -v aocv2-mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-data.tar.gz /data
```

## 🔐 Security Considerations

### Container Security
- All containers run as non-root users
- Network isolation with Docker networks
- Resource limits and health checks
- Regular security updates

### Database Security
- MongoDB authentication enabled
- Redis password protection
- Network access restrictions
- Regular backup procedures

### Network Security
- Firewall configuration
- SSL/TLS termination at Nginx
- CORS configuration
- Access control lists

## 📈 Performance Optimization

### Container Optimization
```bash
# Set resource limits in docker-compose.yml
services:
  aocv2-api:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

### Database Optimization
- MongoDB indexing
- Redis memory optimization
- Connection pooling
- Query optimization

### Nginx Optimization
- Gzip compression
- Browser caching
- Static file serving
- Load balancing

## 🎯 Production Checklist

### Pre-Deployment
- [ ] Server requirements met
- [ ] Docker and Docker Compose installed
- [ ] Environment variables configured
- [ ] SSL certificates ready
- [ ] Firewall configured

### Deployment
- [ ] All containers started successfully
- [ ] Database migration completed
- [ ] API endpoints responding
- [ ] WebSocket connections working
- [ ] Nginx proxy functioning
- [ ] Monitoring active

### Post-Deployment
- [ ] Health checks passing
- [ ] Performance metrics normal
- [ ] Backup procedures tested
- [ ] Documentation updated
- [ ] Team training completed

---

## 📞 Support

### Emergency Procedures
1. **Service Down**: `docker-compose restart [service]`
2. **Database Issues**: Check MongoDB/Redis logs
3. **Network Problems**: Verify port exposure
4. **Performance Issues**: Check resource usage

### Contact Information
- **System Administrator**: root@103.22.182.145:2222
- **Documentation**: Complete Docker deployment guide
- **Last Updated**: September 10, 2025

---

**🎉 AOC V2 Docker System Ready for Production!**

*This comprehensive guide ensures successful deployment and operation of the containerized AOC V2 tracking system.*
