# AOC V2 Centralized Server

This is the new centralized Docker-based server for the AOC V2 system, replacing the distributed PM2-based architecture.

## 🏗️ Architecture

```
16 Ambulance Boxes → API Server (103.22.182.145) → Docker Database → WebSocket Broadcast → AOC Platform Frontend
```

## 🚀 Services

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| **MongoDB** | `samserver-mongodb` | 27017 | Primary database |
| **Redis** | `samserver-redis` | 6379 | Cache and sessions |
| **API Server** | `samserver-api` | 3000 | Express.js API |
| **WebSocket** | `samserver-websocket` | 5055 | Real-time communication |
| **Monitor** | `samserver-monitor` | 3001 | Monitor socket server |
| **P1 Server** | `samserver-p1` | 3002 | P1 socket server |
| **Nginx** | `samserver-nginx` | 80/443 | Reverse proxy |
| **Prometheus** | `samserver-monitoring` | 9090 | Monitoring |

## 📋 Quick Start

1. **Setup Environment**:
   ```bash
   ./scripts/setup.sh
   ```

2. **Start Services**:
   ```bash
   docker-compose up -d
   ```

3. **Check Status**:
   ```bash
   docker-compose ps
   ```

4. **View Logs**:
   ```bash
   docker-compose logs -f [service-name]
   ```

## 🔧 Configuration

1. **Environment Variables**: Update `env.production` with your settings
2. **Database**: MongoDB initialized with `aoc_v2` database
3. **Redis**: Configured with password `aocv2@123!`
4. **Nginx**: Reverse proxy configuration included

## 📊 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ambulances/postHospitalAmbulanceList` | POST | Get hospital ambulance list |
| `/api/ambulances/postAmbulanceDetail` | POST | Get ambulance details |
| `/api/requests/postOngoingRequestList` | POST | Get ongoing requests |
| `/api/hospitals/*` | GET/POST | Hospital management |
| `/api/users_authentication/*` | POST | User authentication |

## 🔌 WebSocket Events

- **Real-time GPS tracking**: `ambulance_tracking`
- **Image uploads**: `ambulance_image`
- **Crash notifications**: `ambulance_crash`
- **Request updates**: `aoc_request`

## 📁 Data Migration

Migrate data from old server (117.18.126.117):

```bash
./scripts/migrate-data.sh
```

This script will:
- Backup old database
- Migrate all collections
- Verify data integrity
- Create migration report

## 🖼️ Image Management

- **Storage**: `/ambulance_images/` directory
- **Access**: `http://localhost/ambulance_images/`
- **Size**: 81GB+ of ambulance images
- **Format**: JPG/PNG with metadata

## 📈 Monitoring

- **Prometheus**: http://localhost:9090
- **Health Checks**: All services have health checks
- **Logs**: Centralized logging in `logs/` directory
- **Metrics**: Performance and usage metrics

## 🔒 Security

- **Authentication**: JWT tokens and API keys
- **CORS**: Configured for multiple origins
- **Rate Limiting**: API and WebSocket rate limits
- **SSL**: Ready for HTTPS configuration

## 📦 Backup & Restore

### Backup
```bash
# Database backup
docker-compose exec samserver-mongodb mongodump --out /backup

# Full system backup
tar -czf backup-$(date +%Y%m%d).tar.gz .
```

### Restore
```bash
# Database restore
docker-compose exec samserver-mongodb mongorestore /backup

# Full system restore
tar -xzf backup-YYYYMMDD.tar.gz
```

## 🚨 Troubleshooting

### Common Issues

1. **Service won't start**:
   ```bash
   docker-compose logs [service-name]
   ```

2. **Database connection failed**:
   ```bash
   docker-compose exec samserver-mongodb mongosh --eval "db.adminCommand('ping')"
   ```

3. **Redis connection failed**:
   ```bash
   docker-compose exec samserver-redis redis-cli ping
   ```

4. **Port conflicts**:
   ```bash
   netstat -tulpn | grep :3000
   ```

### Log Locations

- **API Server**: `logs/api/`
- **WebSocket**: `logs/websocket/`
- **Monitor**: `logs/monitor/`
- **P1 Server**: `logs/p1/`
- **Nginx**: `logs/nginx/`

## 🔄 Maintenance

### Daily Tasks
- Check service health
- Monitor disk space
- Review error logs

### Weekly Tasks
- Database backup
- Log rotation
- Performance review

### Monthly Tasks
- Security updates
- Dependency updates
- Capacity planning

## 📞 Support

- **Documentation**: See `docs/` directory
- **Issues**: Check logs and health status
- **Updates**: Follow version control

## 🎯 Migration Checklist

- [ ] Backup old system
- [ ] Deploy new Docker system
- [ ] Migrate database
- [ ] Update ambulance box configurations
- [ ] Test all endpoints
- [ ] Verify WebSocket connections
- [ ] Monitor system performance
- [ ] Update DNS/load balancer
- [ ] Decommission old system

## 📅 Version History

- **v1.0**: Initial Docker implementation
- **v1.1**: Added monitoring and logging
- **v1.2**: Enhanced security and performance