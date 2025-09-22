# AOC V2 Missing Components Documentation

## Overview
This document covers the previously undocumented components discovered during comprehensive Samserver exploration, including standalone services, backup files, and additional system configurations.

## Table of Contents
1. [Standalone WebSocket Server](#standalone-websocket-server)
2. [Database Services](#database-services)
3. [Backup Files & Archives](#backup-files--archives)
4. [Environment Configuration](#environment-configuration)
5. [System Services](#system-services)
6. [SSL Certificates](#ssl-certificates)
7. [Symbolic Links](#symbolic-links)

---

## Standalone WebSocket Server

### Server Details
| Property | Value |
|----------|-------|
| **Location** | `/home/samserver/aocv2-tracking-websocket-server/` |
| **Status** | Not Running (Standalone) |
| **Purpose** | Dedicated WebSocket server with SSL support |
| **Port** | 5050 (same as main app WebSocket) |
| **SSL Support** | Yes (certificates present) |

### Package Configuration
```json
{
  "name": "tracking-websocket-server",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "nodemon index.js"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.21.1",
    "http": "0.0.1-security",
    "nodemon": "^3.1.7",
    "socket.io": "^4.8.1"
  }
}
```

### Server Implementation
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

let socketCount = 0;

// Basic HTTP endpoint
app.get("/", (req, res) => {
  res.send("Socket.IO server is running on port 5050");
});

// Socket.IO connection setup
io.on("connection", (socket) => {
  console.log(`Socket connected, ID: ${socket.id}`);
  socketCount++;
  
  // Emit initial connection message
  socket.emit("data", `Socket connected, ID: ${socket.id}`);
  
  // Room management
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

// Start server on port 5050
server.listen(5050, () => {
  console.log("Server and Socket.IO listening on port 5050");
});
```

### Key Differences from Main App
| Feature | Main App WebSocket | Standalone Server |
|---------|-------------------|-------------------|
| **Integration** | Integrated with Express app | Standalone Express app |
| **SSL Support** | No SSL certificates | SSL certificates present |
| **Dependencies** | Part of main package.json | Separate package.json |
| **Status** | Active and running | Not running |
| **Purpose** | Real-time data broadcasting | Dedicated WebSocket service |

---

## Database Services

### MySQL/MariaDB Service
| Property | Value |
|----------|-------|
| **Service Name** | mysqld.service |
| **Status** | Active (running) |
| **Version** | MySQL Ver 15.1 Distrib 10.11.13-MariaDB |
| **Purpose** | Unknown (not used by main app) |
| **Connection** | Requires password authentication |

### Service Analysis
```bash
# Service status
systemctl status mysqld.service
# Status: loaded active running LSB: start and stop MySQL

# Version check
mysql --version
# Output: mysql Ver 15.1 Distrib 10.11.13-MariaDB, for debian-linux-gnu (x86_64)
```

### Database Architecture
```
Main Application (Node.js)
├── MongoDB (Primary) - 117.18.126.117:27017
├── Redis (Caching) - 127.0.0.1:6379
└── MySQL/MariaDB (Unknown Purpose) - localhost:3306
```

### Questions for Investigation
1. **Why is MySQL/MariaDB running if the app uses MongoDB?**
2. **What databases exist in MySQL?**
3. **Is this a legacy system or backup database?**
4. **Are there any applications using MySQL?**

---

## Backup Files & Archives

### 1. Migration Backup
| Property | Value |
|----------|-------|
| **File** | `aocv2-migration-backup.tar.gz` |
| **Size** | 24.5MB |
| **Date** | September 9, 2025 |
| **Owner** | root |
| **Contents** | Complete application with node_modules |

#### Contents Analysis
```bash
# Archive structure
aocv2trackingserver-master/
├── node_modules/ (complete dependency tree)
├── bin/
├── config/
├── controllers/
├── models/
├── routes/
├── public/
├── views/
├── server.js
├── socket.js
├── package.json
└── .env
```

### 2. WebSocket Server Archive
| Property | Value |
|----------|-------|
| **File** | `aocv2-tracking-websocket-server.zip` |
| **Size** | 2.5MB |
| **Date** | November 20, 2024 |
| **Owner** | www |
| **Contents** | Standalone WebSocket server |

#### Contents Analysis
```bash
# Archive structure
aocv2-tracking-websocket-server/
├── index.js
├── package.json
├── package-lock.json
├── node_modules/
├── gps_server.crt
├── gps_server.key
└── .htaccess
```

### 3. Tracking Server Archive
| Property | Value |
|----------|-------|
| **File** | `tracking_server.zip` |
| **Size** | 59KB |
| **Date** | October 20, 2024 |
| **Owner** | samserver |
| **Contents** | Minimal application structure |

#### Contents Analysis
```bash
# Archive structure
aocv2trackingserver-master/
├── .env
├── .gitignore
├── bin/www
├── config/configure.js
├── config/db.config.js
├── controllers/
├── models/
├── routes/
├── public/
├── views/
├── server.js
├── socket.js
└── package.json
```

### Backup Strategy Analysis
| Backup Type | Purpose | Frequency | Size |
|-------------|---------|-----------|------|
| **Migration Backup** | Complete system backup | Manual | 24.5MB |
| **WebSocket Archive** | Standalone server backup | Manual | 2.5MB |
| **Tracking Archive** | Minimal app backup | Manual | 59KB |

---

## Environment Configuration

### Complete .env Analysis
```bash
# SSH Credentials
LIVE_SSH_USER=dbapisserver
LIVE_SSH_PSW=AOC!44335599

# Local Development Configuration
LOCAL_DB_HOST=localhost
LOCAL_DB_HOST_PORT=27017
LOCAL_DB=aocv2_development_db
LOCAL_AUTH_DB=admin
LOCAL_REDIS_HOST=127.0.0.1
LOCAL_REDIS_PORT=6379
LOCAL_REDIS_PASSWORD=aocv2@123!

# Live Production Configuration
LIVE_REDIS_HOST=117.18.126.117
LIVE_REDIS_PORT=6379
LIVE_REDIS_PASSWORD=aocv2@123!

# MongoDB Connection Strings
MONGODB_LIVE_URL=mongodb://admin:ThaiAocV21%40@117.18.126.117:27017/aoc_v2?authSource=admin
#MONGODB_LIVE_URL=mongodb://admin:ThaiAocV21%40@192.168.100.117:27017/aoc_v2?authSource=admin
M#ONGODB_LIVE_URL = mongodb://aoc_db_admin:aocdbadmin%40123@202.183.192.153:27017/aocv2_db?authSource=admin&ext.ssh.server=202.183.192.154%3A222&ext.ssh.username=aocv2api&ext.ssh.password=Sim!44335599
MONGODB_TEST_URL = mongodb://aoc_db_admin:aocdbadmin%40123@202.183.192.153:27017/aocv2_db?authSource=admin&ext.ssh.server=202.183.192.154%3A222&ext.ssh.username=aocv2api&ext.ssh.password=Sim!44335599

# External Services
GOOGLE_MAP_KEY=AIzaSyAIOJRDeFlwPICCvcabVmjoscJgVzs63Ls
FCM_SERVER_KEY=AAAA8uxbopM:APA91bFF8t6ItmNKC6QD9FlWgWKpKLYHFA5tpwiq3MxbcpmMMx14PnFTDDzhlxmbzzdniLTya6k6El_bvnGftpZ3Q3dDpA_g2EEpfnb_VF2uMeqlhvLESrKNdvhWgpb9Wm14GvsPngZy
```

### Environment Analysis
| Configuration | Purpose | Status |
|---------------|---------|--------|
| **SSH Credentials** | Database server access | Active |
| **Local Development** | Development environment | Available |
| **Live Production** | Current production setup | Active |
| **Multiple MongoDB URLs** | Different environments | Commented alternatives |
| **External Services** | Google Maps, FCM | Active |

### Security Considerations
- **SSH Credentials**: Stored in plain text
- **Database Passwords**: URL encoded in connection strings
- **API Keys**: Google Maps and FCM keys exposed
- **Multiple Environments**: Development, test, and production configs

---

## System Services

### Active Services
| Service | Status | Purpose |
|---------|--------|---------|
| **nginx.service** | Active | Web server and reverse proxy |
| **redis.service** | Active | Session management and caching |
| **mysqld.service** | Active | MySQL/MariaDB database |
| **PM2 Process** | Active | Node.js application management |

### Service Dependencies
```
System Startup
├── nginx.service (Web server)
├── redis.service (Caching)
├── mysqld.service (Database)
└── PM2 Process (Application)
    └── Node.js App (Port 5000)
    └── WebSocket Server (Port 5050)
```

### Service Management
```bash
# Check service status
systemctl status nginx redis mysqld

# Start/stop services
systemctl start|stop|restart nginx
systemctl start|stop|restart redis
systemctl start|stop|restart mysqld

# Enable/disable services
systemctl enable|disable nginx
systemctl enable|disable redis
systemctl enable|disable mysqld
```

---

## SSL Certificates

### Certificate Files
| File | Type | Size | Purpose |
|------|------|------|---------|
| **gps_server.crt** | OpenSSH private key | 1.7KB | SSL certificate |
| **gps_server.key** | PEM certificate | 3.6KB | SSL private key |

### Certificate Analysis
```bash
# File types
file gps_server.crt
# Output: OpenSSH private key (no password)

file gps_server.key
# Output: PEM certificate
```

### SSL Configuration
- **Location**: `/home/samserver/aocv2-tracking-websocket-server/`
- **Purpose**: HTTPS support for standalone WebSocket server
- **Status**: Not currently used (server not running)
- **Format**: OpenSSH private key + PEM certificate

### SSL Implementation
```javascript
// Potential HTTPS implementation
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('gps_server.key'),
  cert: fs.readFileSync('gps_server.crt')
};

const server = https.createServer(options, app);
```

---

## Symbolic Links

### Active Symbolic Links
| Link | Target | Status |
|------|--------|--------|
| **public** | `/home/samserver/aocv2trackingserver-master/public` | ✅ Active |

### Broken Symbolic Links
| Link | Target | Status | Issue |
|------|--------|--------|-------|
| **aocv2trackingserver-masterc** | `/home/samserver/aocv2trackingserver-masterc` | ❌ Broken | Too many levels of symbolic links |

### Link Analysis
```bash
# Active link
ls -la public
# Output: lrwxrwxrwx 1 samserver samserver 49 Jul 23 12:14 public -> /home/samserver/aocv2trackingserver-master/public

# Broken link
ls -la aocv2trackingserver-masterc
# Output: lrwxrwxrwx 1 samserver samserver 43 Jul 23 11:55 aocv2trackingserver-masterc -> /home/samserver/aocv2trackingserver-masterc
```

### Cleanup Recommendations
1. **Remove broken symlink**: `rm aocv2trackingserver-masterc`
2. **Verify active symlink**: Ensure public directory access works
3. **Document symlink purposes**: Understand why links exist

---

## Summary & Recommendations

### 🔍 **Key Discoveries**

1. **Standalone WebSocket Server**: Separate from main app, has SSL certificates
2. **MySQL/MariaDB Service**: Running but not used by main application
3. **Multiple Backup Files**: Different purposes and sizes
4. **Complex Environment**: Multiple database configurations
5. **SSL Certificates**: Available but not currently used

### ⚠️ **Issues Identified**

1. **Unused Services**: MySQL/MariaDB running without clear purpose
2. **Broken Symlinks**: Circular reference causing issues
3. **Security Concerns**: Credentials stored in plain text
4. **Resource Waste**: Unused services consuming resources

### 🎯 **Recommendations**

#### **Immediate Actions**
1. **Investigate MySQL**: Determine if it's needed or can be stopped
2. **Clean Broken Links**: Remove circular symlink references
3. **Review SSL Setup**: Decide if standalone WebSocket server should be used
4. **Secure Credentials**: Move sensitive data to secure storage

#### **Medium-term Actions**
1. **Document Services**: Create service dependency map
2. **Backup Strategy**: Implement automated backup procedures
3. **Environment Cleanup**: Remove unused configurations
4. **SSL Implementation**: Decide on SSL strategy for WebSocket

#### **Long-term Actions**
1. **Service Optimization**: Remove unused services
2. **Security Hardening**: Implement proper credential management
3. **Monitoring Setup**: Monitor all services and dependencies
4. **Documentation Update**: Keep all documentation current

---

**Document Version:** 1.0  
**Last Updated:** September 10, 2025  
**Server:** 117.18.126.118:2222  
**Environment:** Production (LIVE)
