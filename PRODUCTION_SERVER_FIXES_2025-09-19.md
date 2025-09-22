# Production Server Fixes - September 19, 2025

## Server Information
- Server IP: 103.22.182.145
- SSH Port: 2222
- Path: /www/dk_project/dk_app/sam-server-v3

## Issues Fixed

### 1. WebSocket and Nginx Services Not Running
**Problem**: WebSocket and Nginx containers were not running on the production server.

**Solution**: 
- Started the services using `docker-compose up -d websocket-server nginx`
- Services are now running on their designated ports:
  - WebSocket: Port 8444
  - Nginx: Ports 8080 (HTTP) and 8445 (HTTPS)

### 2. Nginx Configuration Error
**Problem**: Nginx was failing to start with error "host not found in upstream 'main-app:5000'" because the main-app container uses host network mode.

**Solution**:
1. Created backup of nginx.conf: `nginx.conf.backup-20250919-124700`
2. Updated nginx configuration to use Docker bridge IP instead of container name:
   ```
   # Changed from:
   server main-app:5000;
   
   # Changed to:
   server 172.17.0.1:5000;
   ```
3. Rebuilt and restarted Nginx container

## Current System Status
- ✅ Main tracking server (main-app-host) - Running
- ✅ WebSocket server - Running on port 8444
- ✅ Nginx - Running on ports 8080/8445
- ✅ MongoDB databases - Both main and archive running
- ✅ Redis - Running
- ✅ Image uploads - Working fine (656,791 images uploaded on Sept 19)
- ✅ Storage - 97% free space (4.0TB available)

## Ambulance Image Statistics
- Total images in system: 3,027,758
- Images uploaded today (Sept 19, 2025): 656,791
- Recent uploads confirmed from ambulances 21, 25, and 38

## Notes
- The system had been stable for 4 days before the Nginx/WebSocket issue was discovered
- Core functionality (image tracking) was working even without Nginx
- Nginx provides proper routing and SSL termination for the system
