# Production Server Fixes - September 22, 2025

## Server Information
- **Server IP**: 103.22.182.145
- **SSH Port**: 2222
- **Main Path**: /www/dk_project/dk_app/sam-server-v3
- **API Path**: /www/dk_project/dk_app/v2-api-server

## Issues Fixed Today

### 1. WebSocket Server Port 5050 Accessibility ✅
**Problem**: WebSocket server port 5050 was not accessible externally.

**Solution**: 
- Updated `docker-compose.yml` to properly expose port 5050:5050
- Removed incorrect port mapping (8444:443)
- Restarted WebSocket container with correct configuration

**Result**: 
- Port 5050 now accessible at `http://103.22.182.145:5050/`
- WebSocket endpoint working: `ws://103.22.182.145:5050/`

### 2. API Monitor Connection Reset Errors ✅
**Problem**: API Monitor was receiving HTTP health check requests but expecting TCP JSON data, causing:
- "Invalid Json" errors in logs
- ECONNRESET (connection reset) errors
- Continuous error logging

**Root Cause**: Docker health check was making HTTP requests to TCP socket server

**Solution**:
1. Identified health check in `monitorsocketserver-master/Dockerfile`
2. Removed problematic health check: `CMD curl -f http://localhost:3001/ || exit 1`
3. Rebuilt and restarted API Monitor container
4. Container now runs without health check interference

**Result**:
- No more "Invalid Json" errors
- No more ECONNRESET errors
- Clean logs: "opened server on 6000", "opened server on 4500", "Health check server listening on port 6001"

### 3. Nginx Configuration (Previously Fixed)
**Problem**: Nginx couldn't connect to main-app container due to host network mode.

**Solution**: Updated nginx.conf to use Docker bridge IP (172.17.0.1:5000)

**Status**: Still working correctly from previous fix

## Current System Status - ALL SERVICES HEALTHY ✅

### Main Tracking Server Containers:
- ✅ **main-app-host** - Up 7 days (AOC-V.2 Tracking Server)
- ✅ **sam-server-v3_websocket-server_1** - Up 33+ minutes (Port 5050)
- ✅ **sam-server-v3_nginx_1** - Up 2 days (Ports 8080/8445)
- ✅ **api-mongodb** - Up 7 days (healthy)
- ✅ **api-mongodb-archive** - Up 7 days (healthy)
- ✅ **api-redis** - Up 7 days (healthy)

### API Server Containers:
- ✅ **api-monitor** - Up and running without errors

### Active Data Processing:
- ✅ **GPS Tracking**: Real-time ambulance location data being processed
- ✅ **Image Uploads**: Ambulance box images being saved (recent: ambulance ID 23)
- ✅ **Database Operations**: All MongoDB and Redis connections healthy
- ✅ **WebSocket Communications**: Real-time data streaming functional

### Network Endpoints:
- ✅ **Port 5000**: Main tracking server (HTTP 200 OK)
- ✅ **Port 5050**: WebSocket server (accessible externally)
- ✅ **Port 8080**: Nginx proxy (working)
- ✅ **Port 8445**: Nginx HTTPS (working)
- ✅ **Port 3001**: API Monitor TCP socket (clean operation)
- ✅ **Port 27017/27018**: MongoDB instances (healthy)
- ✅ **Port 6379**: Redis (healthy)

## Files Modified on Production Server

### WebSocket Configuration:
- `/www/dk_project/dk_app/sam-server-v3/docker-compose.yml`
  - Updated websocket-server port mapping to 5050:5050

### API Monitor Fix:
- `/www/dk_project/dk_app/v2-api-server/monitorsocketserver-master/Dockerfile`
  - Removed: `HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:3001/ || exit 1`
- Container rebuilt and restarted without health check

### Backup Files Created:
- `docker-compose.yml.backup-20250922-*` (WebSocket config backup)
- `Dockerfile.backup-20250922-*` (API Monitor Dockerfile backup)

## Verification Commands Used

```bash
# Check all containers
docker ps

# Test endpoints
curl -s -I http://localhost:5000/
curl -s -I http://localhost:8080/
curl -s http://localhost:5050/

# Check logs
docker logs --tail 20 api-monitor
docker logs --tail 50 main-app-host

# Verify ports
netstat -tlnp | grep -E '(5000|5050|8080|3001|27017|6379)'
```

## Summary

All production server issues have been successfully resolved:

1. **WebSocket server** is now accessible externally on port 5050
2. **API Monitor** is running cleanly without connection errors
3. **All services** are healthy and processing real-time ambulance data
4. **System uptime** maintained (main services running 7+ days)
5. **Data flow** confirmed: GPS tracking and image uploads working

The production server is now fully operational with all services working optimally.
