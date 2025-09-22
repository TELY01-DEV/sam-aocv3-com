# Production Server Fixes - January 19, 2025

## Issues Fixed

### 1. Docker Build Context Too Large (59GB)
**Problem**: `docker-compose up -d --build` was failing because the build context included a 59GB image folder.

**Solution**: Created `.dockerignore` file to exclude large directories:
- `aocv2trackingserver-master/public/uploads/`
- `**/uploads/`
- `**/ambulance_images/`
- Backup files (*.tar.gz, *.zip, *.bson)
- node_modules directories
- Log files

### 2. Port 5000 Already in Use
**Problem**: `Port 5000 is already in use` error when starting main-app container.

**Solution**: 
- Stopped old `main-app-host` container: `docker stop main-app-host`
- Removed old container: `docker rm main-app-host`
- Started new `main-app` container successfully

### 3. Unused Network Warning
**Problem**: `WARNING: Some networks were defined but are not used by any service: v2-api-server_api-network`

**Solution**: Removed unused network configuration from docker-compose.yml

## Files Modified

1. **`.dockerignore`** - Created to exclude large files from Docker build context
2. **`docker-compose.yml`** - Removed unused network configuration
3. **`aocv2trackingserver-master/Dockerfile`** - Added directory creation for uploads

## Verification

After fixes:
- ✅ Docker build completed successfully (reduced from 59GB to manageable size)
- ✅ All containers running: main-app, websocket-server, nginx
- ✅ System receiving new GPS and image data from ambulance #33
- ✅ API endpoints responding correctly
- ✅ No critical errors in logs

## Current Status

All services operational and receiving new data from ambulances. The system is fully functional after resolving the Docker build context issue.
