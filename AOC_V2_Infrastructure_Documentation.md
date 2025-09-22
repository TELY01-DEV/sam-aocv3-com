# AOC V2 Tracking System - Infrastructure Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Environment Setup](#environment-setup)
3. [API Endpoints](#api-endpoints)
4. [Nginx Configuration](#nginx-configuration)
5. [Data Processing Workflows](#data-processing-workflows)
6. [File Upload System](#file-upload-system)
7. [WebSocket Infrastructure](#websocket-infrastructure)
8. [Database Architecture](#database-architecture)
9. [Security & Monitoring](#security--monitoring)
10. [Deployment & Maintenance](#deployment--maintenance)

---

## System Overview

The AOC V2 Tracking System is a real-time ambulance tracking and monitoring platform that provides:
- Real-time GPS tracking of ambulances
- Image capture and storage system
- Crash detection and notification
- WebSocket-based real-time communication
- RESTful API for data exchange

**Server Details:**
- **Host:** 117.18.126.118:2222
- **User:** samserver
- **Environment:** Production (LIVE)
- **Uptime:** 48+ days

---

## Environment Setup

### Runtime Environment
```bash
Node.js: v21.7.3
NPM: v10.5.0
PM2: v5.4.2
Nginx: 1.24.0
```

### Environment Variables (.env)
```bash
ENVIRONMENT=LIVE
SOCKET_SERVER_PORT=5050

# Database Configuration
LIVE_DB_USER=admin
LIVE_DB_USER_PSW=ThaiAocV21
LIVE_DB_HOST=192.168.100.117
LIVE_DB_HOST_PORT=27017
LIVE_DB=aoc_v2
LIVE_AUTH_DB=admin

# Redis Configuration
LIVE_REDIS_HOST=117.18.126.117
LIVE_REDIS_PORT=6379
LIVE_REDIS_PASSWORD=aocv2@123!

# MongoDB Connection String
MONGODB_LIVE_URL=mongodb://admin:ThaiAocV21%40@117.18.126.117:27017/aoc_v2?authSource=admin

# External Services
GOOGLE_MAP_KEY=AIzaSyAIOJRDeFlwPICCvcabVmjoscJgVzs63Ls
FCM_SERVER_KEY=AAAA8uxbopM:APA91bFF8t6ItmNKC6QD9FlWgWKpKLYHFA5tpwiq3MxbcpmMMx14PnFTDDzhlxmbzzdniLTya6k6El_bvnGftpZ3Q3dDpA_g2EEpfnb_VF2uMeqlhvLESrKNdvhWgpb9Wm14GvsPngZy
```

### Project Structure
```
/home/samserver/aocv2trackingserver-master/
├── bin/www                    # Application entry point
├── config/
│   ├── db.config.js          # Database configuration
│   └── configure.js          # Utility functions
├── controllers/              # API controllers
├── models/                   # MongoDB models
├── routes/                   # API routes
├── public/uploads/           # File storage (92GB)
├── server.js                 # Main server file
├── socket.js                 # WebSocket configuration
└── package.json              # Dependencies
```

---

## API Endpoints

### Base URLs
- **Main API:** `http://sam.aocv2.com` (Port 5000)
- **WebSocket:** `http://sam-gps.aocv2.com` (Port 5050)

### Available Endpoints

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| `GET` | `/` | Health check | - | Status message |
| `GET` | `/error_codes` | Error codes reference | - | Error codes list |
| `POST` | `/api/tracking/postAmbulanceTracking` | GPS tracking data | GPS coordinates, speed, heading | Success/Error |
| `POST` | `/api/crash/postAmbulanceCrashNotify` | Crash incident reporting | Crash data, location, speed | Success/Error |
| `POST` | `/api/snapshot/postAmbulanceImageUpload` | Image upload | Multipart form with images | Success/Error |

### API Request Examples

#### GPS Tracking
```bash
POST /api/tracking/postAmbulanceTracking
Content-Type: application/json

{
  "ambulance_id": "332",
  "tracking_latitude": 13.7563,
  "tracking_longitude": 100.5018,
  "tracking_speed": 45.5,
  "tracking_heading": 180
}
```

#### Image Upload
```bash
POST /api/snapshot/postAmbulanceImageUpload
Content-Type: multipart/form-data

ambulance_id: "332"
files: [image1.jpg, image2.jpg, ...]
```

#### Crash Notification
```bash
POST /api/crash/postAmbulanceCrashNotify
Content-Type: application/json

{
  "ambulance_id": "332",
  "tracking_latitude": 13.7563,
  "tracking_longitude": 100.5018,
  "tracking_speed": 150.0,
  "tracking_heading": 90
}
```

---

## Nginx Configuration

### Main Configuration
**File:** `/www/server/nginx/conf/nginx.conf`

```nginx
user www www;
worker_processes auto;
error_log /www/wwwlogs/nginx_error.log crit;
pid /www/server/nginx/logs/nginx.pid;
worker_rlimit_nofile 51200;

events {
    use epoll;
    worker_connections 51200;
    multi_accept on;
}

http {
    include mime.types;
    include proxy.conf;
    
    default_type application/octet-stream;
    server_names_hash_bucket_size 512;
    client_header_buffer_size 32k;
    large_client_header_buffers 4 32k;
    client_max_body_size 50m;
    
    sendfile on;
    tcp_nopush on;
    keepalive_timeout 60;
    tcp_nodelay on;
    
    # Gzip compression
    gzip on;
    gzip_min_length 1k;
    gzip_buffers 4 16k;
    gzip_http_version 1.1;
    gzip_comp_level 2;
    gzip_types text/plain application/javascript application/x-javascript text/javascript text/css application/xml application/json image/jpeg image/gif image/png font/ttf font/otf image/svg+xml application/xml+rss text/x-js;
    gzip_vary on;
    gzip_proxied expired no-cache no-store private auth;
    gzip_disable "MSIE [1-6]\.";
    
    # Rate limiting
    limit_conn_zone $binary_remote_addr zone=perip:10m;
    limit_conn_zone $server_name zone=perserver:10m;
    
    server_tokens off;
    access_log off;
}
```

### Virtual Hosts

#### Main Application (Port 5000)
```nginx
server {
    listen 80;
    server_name sam.aocv2.com;
    
    location / {
        proxy_pass http://117.18.126.118:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### WebSocket Server (Port 5050)
```nginx
server {
    listen 80;
    server_name sam-gps.aocv2.com;
    
    location / {
        proxy_pass http://117.18.126.118:5050;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Performance Metrics
- **Worker Processes:** 34 (auto-scaling)
- **Worker Connections:** 51,200 per worker
- **Memory Usage:** 1.2GB (Peak: 3.2GB)
- **Client Max Body Size:** 50MB

---

## Data Processing Workflows

### 1. Real-time GPS Tracking Pipeline

```mermaid
graph TD
    A[Ambulance Device] -->|GPS Data| B[API Endpoint]
    B --> C[Data Validation]
    C --> D[Speed Conversion]
    D --> E[Database Storage]
    E --> F[WebSocket Broadcast]
    F --> G[Connected Clients]
    
    E --> H[Current Tracking]
    E --> I[Historical Data]
    
    H --> J[ambulance_trackings]
    I --> K[ambulance_tracking_histories]
```

#### Processing Steps:
1. **Data Reception:** GPS coordinates, speed, heading from ambulance devices
2. **Validation:** Coordinate validation, speed conversion (m/s to km/h)
3. **Assignment Check:** Verify if ambulance is assigned to active AOC request
4. **Database Storage:** 
   - Current data → `ambulance_trackings`
   - Historical data → `ambulance_tracking_histories`
5. **Real-time Broadcasting:** WebSocket emission to connected clients
6. **Redis Caching:** Session and temporary data storage

### 2. Crash Detection System

```mermaid
graph TD
    A[GPS Data] --> B{Speed Check}
    B -->|≤ 80 km/h| C[GREEN State]
    B -->|80-120 km/h| D[ORANGE State]
    B -->|> 120 km/h| E[RED State]
    
    C --> F[Log Normal]
    D --> G[Log Warning]
    E --> H[Crash Detection]
    
    H --> I[Create Crash Record]
    I --> J[Generate Map Image]
    J --> K[Send Notification]
    K --> L[FCM Push Notification]
```

#### Speed Classification:
- **GREEN:** ≤ 80 km/h (Normal operation)
- **ORANGE:** 80-120 km/h (Warning state)
- **RED:** > 120 km/h (Crash detection)

#### Crash Processing:
1. **Speed Analysis:** Automatic speed-based state classification
2. **Incident Recording:** Location, speed, heading, timestamp
3. **Google Maps Integration:** Static map generation for crash locations
4. **Notification System:** Push notifications via FCM to `opera.aocv2.com`

### 3. Image Processing Workflow

```mermaid
graph TD
    A[Image Upload] --> B[Multipart Processing]
    B --> C[Directory Creation]
    C --> D[File Processing]
    D --> E[Database Storage]
    E --> F[History Management]
    
    C --> G[ambulance_id/YYYY/MM/DD/HH_MM/]
    D --> H[Random Filename Generation]
    E --> I[ambulance_images]
    F --> J[ambulance_image_histories]
```

#### Image Processing Steps:
1. **Upload Reception:** Multipart form data with multiple images
2. **Directory Structure:** `{ambulance_id}/{year}/{month}/{day}/{hour}_{minute}/`
3. **File Processing:** Random filename generation, buffer writing
4. **Database Storage:** Image metadata in `ambulance_images`
5. **History Management:** Previous images moved to `ambulance_image_histories`

---

## File Upload System

### Storage Architecture
```
/home/samserver/aocv2trackingserver-master/public/uploads/ambulance_images/
├── 14/2024/8/18/10_30/
├── 19/2024/8/18/15_14/
├── 21/2024/8/18/12_28/
├── 332/2025/9/3/9_16/
│   ├── 16_41_3133.png
│   ├── 16_41_4123.png
│   ├── 16_41_4456.png
│   └── 16_41_9233.png
└── ...
```

### File Naming Convention
- **Format:** `{minute}_{second}_{random4digits}.{extension}`
- **Example:** `16_41_4456.png`
- **Supported Formats:** PNG, JPG

### Storage Statistics
- **Total Storage:** 82GB
- **File Count:** 9,538,908 files
- **Average File Size:** ~8.6KB per file
- **Directory Structure:** Organized by ambulance_id/date/time

### File Processing Features
- **Automatic Directory Creation:** Recursive directory creation
- **Duplicate Handling:** File replacement if exists
- **Metadata Storage:** Database records with file paths and timestamps
- **History Management:** Previous images archived automatically

---

## WebSocket Infrastructure

### Dual WebSocket Setup

#### 1. Main Application Socket (Integrated)
**File:** `/home/samserver/aocv2trackingserver-master/socket.js`
```javascript
module.exports = app => {
    var httpserver = app.listen(process.env.SOCKET_SERVER_PORT);
    var io = require('socket.io')(httpserver, {
        serveClient: true,
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    
    io.on("connection", (socket) => {
        socket.emit('data', 'socket connected id: '+socket.id);
        
        socket.on('room_join', function(data) {
            data = data.replace(/['"]+/g, '')
            socket.join(String(data));
            io.sockets.emit('data', 'room joined: '+String(data));
        })
        
        socket.on('room_leave', function(data) {
            data = data.replace(/['"]+/g, '')
            socket.leave(String(data));
        })
    })
    
    return io;
}
```

#### 2. Dedicated WebSocket Server (Standalone)
**File:** `/home/samserver/aocv2-tracking-websocket-server/index.js`
```javascript
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
    },
});

io.on("connection", (socket) => {
    console.log(`Socket connected, ID: ${socket.id}`);
    socketCount++;
    
    socket.emit("data", `Socket connected, ID: ${socket.id}`);
    
    socket.on("room_join", (data) => {
        const room = data.replace(/['"]+/g, "");
        socket.join(room);
        io.to(room).emit("data", `User joined room: ${room}`);
    });
    
    socket.on("room_leave", (data) => {
        const room = data.replace(/['"]+/g, "");
        socket.leave(room);
        io.to(room).emit("data", `User left room: ${room}`);
    });
    
    socket.on("disconnect", () => {
        socketCount--;
        console.log(`Socket disconnected, ID: ${socket.id}`);
    });
});

server.listen(5050, () => {
    console.log("Server and Socket.IO listening on port 5050");
});
```

### Real-time Features
- **Room Management:** Dynamic room joining/leaving by ambulance ID
- **Connection Tracking:** Active socket count monitoring
- **CORS Support:** Cross-origin connections enabled
- **Current Connections:** 55+ active WebSocket connections
- **SSL Support:** HTTPS with certificates (`gps_server.crt`, `gps_server.key`)

### Communication Flow
1. **Client Connection:** Socket.IO client connects to port 5050
2. **Room Assignment:** Ambulance-specific rooms for targeted communication
3. **Data Broadcasting:** Real-time GPS updates to room members
4. **Event Handling:** Connection/disconnection management

---

## Database Architecture

### MongoDB Collections

#### 1. Ambulances (`ambulances`)
```javascript
{
  _id: ObjectId,
  ambulance_box_code: String,  // Unique identifier
  // ... other ambulance metadata
}
```

#### 2. Ambulance Trackings (`ambulance_trackings`)
```javascript
{
  _id: ObjectId,
  ambulance_id: ObjectId,
  location: {
    lat: Number,
    lon: Number
  },
  speed: Number,
  heading: String,
  tracking_datetime: Date,
  is_assign: Number,  // 0 or 1
  request_type: String
}
```

#### 3. Ambulance Tracking Histories (`ambulance_tracking_histories`)
```javascript
{
  _id: ObjectId,
  ambulance_id: ObjectId,
  location: {
    lat: Number,
    lon: Number
  },
  speed: Number,
  heading: String,
  tracking_datetime: Date,
  createdAt: Date
}
```

#### 4. Ambulance Images (`ambulance_images`)
```javascript
{
  _id: ObjectId,
  ambulance_id: ObjectId,
  images: Object,  // Key-value pairs of image paths
  createdAt: Date,
  ambulance_image_histories_id: ObjectId
}
```

#### 5. Ambulance Image Histories (`ambulance_image_histories`)
```javascript
{
  _id: ObjectId,
  ambulance_id: ObjectId,
  images: Object,  // Previous images
  createdAt: Date
}
```

#### 6. Ambulance Crashes (`ambulance_crashes`)
```javascript
{
  _id: ObjectId,
  ambulance_id: ObjectId,
  location: {
    lat: Number,
    lon: Number
  },
  speed: Number,
  heading: String,
  count_datetime: Date,
  state: String,  // GREEN, ORANGE, RED
  location_detail: {
    address: String,
    image: String
  }
}
```

### Database Connection
```javascript
// db.config.js
const mongoose = require("mongoose");

if (process.env.ENVIRONMENT == "LIVE") {
    db.url = process.env.MONGODB_LIVE_URL;
} else {
    db.url = "mongodb+srv://vcdeltatech92024:eDZoQJqiS3rtpGbg@cluster0.h2xpx.mongodb.net/";
}

db.mongoose.connect(db.url, {
    useCreateIndex: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    socketTimeoutMS: 25000,
    keepAlive: true,
});
```

### Redis Configuration
- **Host:** 117.18.126.117:6379
- **Password:** aocv2@123!
- **Purpose:** Session management and caching
- **Connection:** Active and operational

---

## Security & Monitoring

### Security Features
- **SSL/TLS:** Certificates configured for HTTPS
- **CORS:** Configured for cross-origin requests
- **Environment Variables:** Sensitive data in .env files
- **File Permissions:** Proper directory permissions (755/644)
- **Rate Limiting:** Nginx connection limits configured

### Monitoring & Logging
- **PM2 Process Manager:** Application monitoring and auto-restart
- **Nginx Access Logs:** `/www/wwwlogs/`
- **Application Logs:** PM2 managed logs
- **Error Tracking:** Nginx error logs and application error handling

### Current System Status
- **Application Status:** ✅ Online (314 restarts - indicates instability)
- **Database:** ✅ Connected to MongoDB
- **Redis:** ✅ Connected and operational
- **WebSocket:** ✅ Active (real-time connections)
- **File Storage:** ✅ 82GB of images stored
- **Uptime:** 48+ days

### Performance Metrics
- **CPU Load:** 2.42 (moderate)
- **Memory Usage:** 4.3GB used / 62GB total (7% utilization)
- **Disk Usage:** 247GB used / 482GB total (54% utilization)
- **Network:** Active connections on ports 80, 443, 5000, 5050

---

## Deployment & Maintenance

### PM2 Process Management
```bash
# Check status
pm2 list

# View logs
pm2 logs tracking --lines 20

# Restart application
pm2 restart tracking

# Stop application
pm2 stop tracking

# Start application
pm2 start tracking
```

### Application Startup
```bash
# Main application
cd /home/samserver/aocv2trackingserver-master
npm start

# WebSocket server
cd /home/samserver/aocv2-tracking-websocket-server
node index.js
```

### Backup Procedures
- **Full System Backup:** `aocv2-migration-backup.tar.gz` (46MB)
- **Image Storage:** 82GB ambulance images (excluded from backup)
- **Database Backup:** MongoDB dump procedures
- **File Backup:** Image storage backup strategy

### Maintenance Tasks
1. **Regular Log Rotation:** Nginx and application logs
2. **Database Cleanup:** Old tracking histories and image histories
3. **File Storage Management:** Image cleanup and archiving
4. **SSL Certificate Renewal:** March 12, 2027
5. **Security Updates:** Node.js, NPM, and system packages

### Troubleshooting
1. **High Restart Count:** Monitor PM2 logs for error patterns
2. **Database Connection Issues:** Check MongoDB connectivity
3. **File Upload Problems:** Verify disk space and permissions
4. **WebSocket Disconnections:** Check network and firewall settings
5. **Performance Issues:** Monitor CPU, memory, and disk usage

---

## API Integration Examples

### JavaScript Client (WebSocket)
```javascript
const socket = io('http://sam-gps.aocv2.com');

socket.on('connect', () => {
    console.log('Connected to WebSocket server');
    socket.emit('room_join', 'ambulance_332');
});

socket.on('data', (data) => {
    console.log('Received data:', data);
});
```

### cURL Examples
```bash
# Health check
curl http://sam.aocv2.com/

# GPS tracking
curl -X POST http://sam.aocv2.com/api/tracking/postAmbulanceTracking \
  -H "Content-Type: application/json" \
  -d '{
    "ambulance_id": "332",
    "tracking_latitude": 13.7563,
    "tracking_longitude": 100.5018,
    "tracking_speed": 45.5,
    "tracking_heading": 180
  }'

# Image upload
curl -X POST http://sam.aocv2.com/api/snapshot/postAmbulanceImageUpload \
  -F "ambulance_id=332" \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg"
```

---

## Conclusion

The AOC V2 Tracking System is a comprehensive, production-ready platform that successfully handles:
- Real-time GPS tracking of multiple ambulances
- Massive file storage (10M+ images, 92GB)
- WebSocket-based real-time communication
- Crash detection and notification systems
- RESTful API for data exchange

The system demonstrates robust architecture with proper separation of concerns, scalable file storage, and real-time communication capabilities. While there are some stability concerns (high restart count), the system continues to operate effectively in production with active real-time tracking and data processing.

---

**Document Version:** 1.1  
**Last Updated:** September 10, 2025  
**Server:** 117.18.126.118:2222  
**Environment:** Production (LIVE)
