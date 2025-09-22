# AOC V2 PM2 Environment Documentation

## Overview
This document provides a comprehensive analysis of the PM2 process manager environment running on the Samserver (117.18.126.118:2222). PM2 is used to manage the AOC V2 tracking server application with automatic restart capabilities, monitoring, and log management.

## Table of Contents
1. [PM2 Process Status](#pm2-process-status)
2. [PM2 Configuration](#pm2-configuration)
3. [Directory Structure](#directory-structure)
4. [Performance Metrics](#performance-metrics)
5. [Environment Variables](#environment-variables)
6. [Log Analysis](#log-analysis)
7. [Issues Identified](#issues-identified)
8. [PM2 Management Commands](#pm2-management-commands)
9. [Monitoring Actions](#monitoring-actions)
10. [Recommendations](#recommendations)

---

## PM2 Process Status

### Current Process Information
| Property | Value |
|----------|-------|
| **Process Name** | tracking |
| **Process ID** | 0 |
| **Status** | online |
| **System PID** | 3669021 |
| **Uptime** | 38 minutes |
| **Restart Count** | 314 ⚠️ |
| **Memory Usage** | 130.1MB |
| **CPU Usage** | 0% |
| **Node.js Version** | 21.7.3 |
| **Execution Mode** | fork_mode |

### Process Details
- **Script Path**: `/home/samserver/aocv2trackingserver-master/bin/www`
- **Working Directory**: `/home/samserver/aocv2trackingserver-master`
- **User**: samserver
- **Created**: 2025-09-03T17:50:35.229Z
- **Watch Mode**: Disabled
- **Auto Restart**: Enabled
- **Auto Start**: Enabled

---

## PM2 Configuration

### Process Configuration (dump.pm2)
```json
{
  "name": "tracking",
  "script": "/home/samserver/aocv2trackingserver-master/bin/www",
  "cwd": "/home/samserver/aocv2trackingserver-master",
  "exec_mode": "fork_mode",
  "instances": 1,
  "autorestart": true,
  "autostart": true,
  "watch": false,
  "max_memory_restart": "1G",
  "node_args": [],
  "env": {
    "NODE_ENV": "production"
  },
  "pm_out_log_path": "/home/samserver/.pm2/logs/tracking-out.log",
  "pm_err_log_path": "/home/samserver/.pm2/logs/tracking-error.log",
  "pm_pid_path": "/home/samserver/.pm2/pids/tracking-0.pid"
}
```

### Key Configuration Settings
- **Execution Mode**: `fork_mode` (single process instance)
- **Auto Restart**: ✅ Enabled (restarts on crash)
- **Auto Start**: ✅ Enabled (starts on system boot)
- **Watch Mode**: ❌ Disabled (no file watching)
- **Max Memory Restart**: 1GB (restarts if memory exceeds limit)
- **Log Merging**: ✅ Enabled
- **Kill Retry Time**: 100ms
- **Tree Kill**: ✅ Enabled (kills child processes)

---

## Directory Structure

### PM2 Home Directory: `/home/samserver/.pm2/`
```
.pm2/
├── dump.pm2                    # Process configuration backup
├── dump.pm2.bak               # Backup of configuration
├── logs/                      # Application logs directory
│   ├── tracking-error.log     # Error logs (2.3GB) ⚠️
│   ├── tracking-out.log        # Output logs (2.5MB)
│   ├── tracking-image-error.log # Image processing errors
│   ├── tracking-image-out.log   # Image processing output
│   ├── tracking-server-error.log # Server errors
│   ├── tracking-server-out.log  # Server output
│   ├── tracking-ws-error.log    # WebSocket errors
│   └── tracking-ws-out.log      # WebSocket output
├── pids/                      # Process ID files
│   └── tracking-0.pid         # Process PID file
├── modules/                   # PM2 modules directory
├── module_conf.json          # Module configuration
├── pm2.log                   # PM2 system log (610KB)
├── pm2.pid                   # PM2 daemon PID
├── pub.sock                  # Publisher socket
├── rpc.sock                  # RPC socket
└── touch                     # Touch file
```

### Log File Sizes
| Log File | Size | Status |
|----------|------|--------|
| tracking-error.log | 2.3GB | ⚠️ Very Large |
| tracking-out.log | 2.5MB | ✅ Normal |
| pm2.log | 610KB | ✅ Normal |
| tracking-image-*.log | <100KB | ✅ Normal |
| tracking-server-*.log | <1MB | ✅ Normal |
| tracking-ws-*.log | <100KB | ✅ Normal |

---

## Performance Metrics

### HTTP Performance
| Metric | Value | Status |
|--------|-------|--------|
| **Request Rate** | 14.15 req/min | ✅ Active |
| **HTTP P95 Latency** | 3ms | ✅ Excellent |
| **HTTP Mean Latency** | 1ms | ✅ Excellent |

### Memory Performance
| Metric | Value | Status |
|--------|-------|--------|
| **Used Heap Size** | 35.67 MiB | ✅ Normal |
| **Heap Usage** | 51.83% | ✅ Moderate |
| **Heap Size** | 68.81 MiB | ✅ Stable |
| **Memory Usage** | 130.1MB | ✅ Normal |

### Event Loop Performance
| Metric | Value | Status |
|--------|-------|--------|
| **Event Loop Latency P95** | 1.14ms | ✅ Excellent |
| **Event Loop Latency** | 0.21ms | ✅ Excellent |
| **Active Handles** | 25 | ✅ Normal |
| **Active Requests** | 0 | ✅ Idle |

---

## Environment Variables

### System Environment
| Variable | Value |
|----------|-------|
| **USER** | samserver |
| **HOME** | /home/samserver |
| **PWD** | /home/samserver/aocv2trackingserver-master |
| **SHELL** | /bin/bash |
| **LANG** | C.UTF-8 |
| **TERM** | xterm-256color |
| **PATH** | /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin |

### PM2 Specific Variables
| Variable | Value |
|----------|-------|
| **PM2_HOME** | /home/samserver/.pm2 |
| **PM2_USAGE** | CLI |
| **NODE_APP_INSTANCE** | 0 |
| **unique_id** | 79f3fc45-c84c-46f8-8468-c378ce003b20 |
| **node_version** | 21.7.3 |
| **version** | 0.0.0 |

### SSH Connection Variables
| Variable | Value |
|----------|-------|
| **SSH_CONNECTION** | 49.0.81.155 49853 117.18.126.118 2222 |
| **SSH_CLIENT** | 49.0.81.155 49853 2222 |
| **SSH_TTY** | /dev/pts/3 |

---

## Log Analysis

### Log File Analysis
| Log Type | File | Size | Purpose |
|----------|------|------|---------|
| **Error Log** | tracking-error.log | 2.3GB | Application errors and exceptions |
| **Output Log** | tracking-out.log | 2.5MB | Application output and info messages |
| **PM2 System** | pm2.log | 610KB | PM2 daemon operations |
| **Image Processing** | tracking-image-*.log | <100KB | Image upload/processing logs |
| **Server Operations** | tracking-server-*.log | <1MB | Server-specific operations |
| **WebSocket** | tracking-ws-*.log | <100KB | WebSocket connection logs |

### Log Rotation Status
- **Automatic Rotation**: PM2 handles log rotation automatically
- **Manual Cleanup**: Error log requires immediate attention
- **Backup Strategy**: Configuration files are backed up

---

## Issues Identified

### 🚨 Critical Issues

#### 1. High Restart Count
- **Issue**: 314 restarts indicate application instability
- **Impact**: Service interruptions and poor user experience
- **Priority**: HIGH
- **Action Required**: Investigate root cause of crashes

#### 2. Large Error Log
- **Issue**: 2.3GB error log file
- **Impact**: Disk space consumption and log analysis difficulty
- **Priority**: HIGH
- **Action Required**: Log cleanup and error investigation

### ⚠️ Warning Issues

#### 3. Application Stability
- **Issue**: Frequent restarts suggest code or configuration issues
- **Impact**: Reduced service reliability
- **Priority**: MEDIUM
- **Action Required**: Code review and stability improvements

### ✅ Working Well
- **Memory Management**: Stable memory usage (130.1MB)
- **Performance**: Excellent HTTP latency (1-3ms)
- **Event Loop**: Healthy event loop performance
- **Process Management**: PM2 successfully managing the application

---

## PM2 Management Commands

### Basic Process Management
```bash
# List all processes
pm2 list

# Show detailed process information
pm2 show tracking

# View real-time logs
pm2 logs tracking

# View logs with line limit
pm2 logs tracking --lines 1000

# Restart process
pm2 restart tracking

# Stop process
pm2 stop tracking

# Start process
pm2 start tracking

# Delete process
pm2 delete tracking

# Reload process (zero-downtime)
pm2 reload tracking
```

### Monitoring Commands
```bash
# Show environment variables
pm2 env 0

# Monitor CPU and memory usage
pm2 monit

# Show process information
pm2 info tracking

# Show process status
pm2 status
```

### Configuration Management
```bash
# Save current process list
pm2 save

# Resurrect saved processes
pm2 resurrect

# Show startup script
pm2 startup

# Generate startup script
pm2 startup systemd
```

---

## Monitoring Actions

### Available PM2 Actions
| Action | Description | Usage |
|--------|-------------|-------|
| **km:heapdump** | Generate heap dump for memory analysis | `pm2 trigger tracking km:heapdump` |
| **km:cpu:profiling:start** | Start CPU profiling | `pm2 trigger tracking km:cpu:profiling:start` |
| **km:cpu:profiling:stop** | Stop CPU profiling | `pm2 trigger tracking km:cpu:profiling:stop` |
| **km:heap:sampling:start** | Start heap sampling | `pm2 trigger tracking km:heap:sampling:start` |
| **km:heap:sampling:stop** | Stop heap sampling | `pm2 trigger tracking km:heap:sampling:stop` |

### Performance Monitoring
- **HTTP Metrics**: Request rate, latency, error rates
- **Memory Metrics**: Heap usage, memory consumption
- **Event Loop**: Latency and performance metrics
- **Process Metrics**: CPU usage, memory usage, uptime

---

## Recommendations

### Immediate Actions (High Priority)

#### 1. Investigate Restart Cause
```bash
# Check recent error logs
pm2 logs tracking --lines 1000 | grep -i error

# Analyze crash patterns
pm2 logs tracking --lines 5000 | grep -i "restart\|crash\|error"
```

#### 2. Clean Up Error Log
```bash
# Backup current error log
cp /home/samserver/.pm2/logs/tracking-error.log /home/samserver/.pm2/logs/tracking-error.log.backup

# Clear error log
> /home/samserver/.pm2/logs/tracking-error.log

# Or truncate to last 1000 lines
tail -1000 /home/samserver/.pm2/logs/tracking-error.log > /tmp/error.log
mv /tmp/error.log /home/samserver/.pm2/logs/tracking-error.log
```

#### 3. Monitor Process Stability
```bash
# Set up continuous monitoring
pm2 monit

# Check process health
pm2 show tracking
```

### Medium-Term Actions

#### 4. Implement Log Rotation
- Configure automatic log rotation
- Set up log compression
- Implement log archival strategy

#### 5. Performance Optimization
- Review memory usage patterns
- Optimize application code
- Implement health checks

#### 6. Monitoring Setup
- Set up alerting for high restart counts
- Implement automated log analysis
- Create performance dashboards

### Long-Term Actions

#### 7. Application Stability
- Code review for stability issues
- Implement proper error handling
- Add comprehensive logging

#### 8. Infrastructure Improvements
- Consider clustering for high availability
- Implement load balancing
- Set up backup and recovery procedures

---

## Conclusion

The PM2 environment is **properly configured** and **functioning** with good performance metrics. However, the **high restart count (314)** and **large error log (2.3GB)** indicate **stability issues** that require immediate attention.

### Key Findings:
- ✅ **PM2 Configuration**: Properly set up with auto-restart and monitoring
- ✅ **Performance**: Excellent HTTP latency and memory usage
- ⚠️ **Stability**: High restart count needs investigation
- ⚠️ **Logs**: Large error log requires cleanup and analysis

### Next Steps:
1. **Investigate restart causes** by analyzing error logs
2. **Clean up error log** to free disk space
3. **Monitor process stability** continuously
4. **Implement log rotation** for long-term maintenance

The system is **operational** but requires **stability improvements** to ensure reliable service delivery.

---

*Document generated on: September 10, 2025 at 09:11:50 +07*
*Server: samserver@117.18.126.118:2222*
*PM2 Version: 5.4.2*
*Node.js Version: 21.7.3*
