# Docker Deployment Guide
## StreamHub Pro - Three-Tier Architecture

This document provides a quick start guide for deploying StreamHub Pro using Docker.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION TIER                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Frontend (React + Vite + Nginx)                   │   │
│  │   Port: 8080                                         │   │
│  │   Dockerfile: ./Dockerfile                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION TIER                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Backend (Node.js + FFmpeg + RTMP)                │   │
│  │   Ports: 3000 (API), 8080 (WS), 1935 (RTMP)       │   │
│  │   Dockerfile: ./Dockerfile.backend                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATA TIER                             │
│  ┌──────────────────┐  ┌─────────────────────────────┐    │
│  │  PostgreSQL      │  │  Redis                       │    │
│  │  Port: 5432      │  │  Port: 6379                  │    │
│  └──────────────────┘  └─────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

### 1. Local Development

```bash
# Start all services
docker-compose up --build

# Access the application
Frontend:  http://localhost:8080
Backend:   http://localhost:3000
RTMP:      rtmp://localhost:1935
WebSocket: ws://localhost:8081
```

### 2. Production Deployment

```bash
# Build images
docker-compose build

# Start in detached mode
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Available Services

### Frontend Service
- **URL**: http://localhost:8080
- **Technology**: React 19 + Vite + Nginx
- **Purpose**: User interface for streaming studio
- **Health Check**: http://localhost:8080

### Backend Service
- **API URL**: http://localhost:3000
- **WebSocket**: ws://localhost:8081
- **RTMP**: rtmp://localhost:1935
- **HLS**: http://localhost:8000
- **Technology**: Node.js + FFmpeg + Node-Media-Server
- **Purpose**: Stream transcoding and multi-platform distribution
- **Health Check**: http://localhost:3000/health

### PostgreSQL Database
- **Port**: 5432
- **Database**: streamhub
- **Username**: streamhub
- **Password**: streamhub (change in production!)
- **Purpose**: Persistent data storage

### Redis Cache
- **Port**: 6379
- **Purpose**: Session management and caching

## Environment Variables

Create a `.env` file in the root directory:

```env
# Frontend
NODE_ENV=production
VITE_BACKEND_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:8081
VITE_GEMINI_API_KEY=your_gemini_api_key

# Backend
DATABASE_URL=postgresql://streamhub:streamhub@postgres:5432/streamhub
REDIS_HOST=redis
REDIS_PORT=6379
RTMP_PORT=1935
API_PORT=3000
WS_PORT=8080

# Database
POSTGRES_DB=streamhub
POSTGRES_USER=streamhub
POSTGRES_PASSWORD=streamhub
```

## Docker Commands Cheat Sheet

```bash
# Build specific service
docker-compose build frontend
docker-compose build backend

# Restart a service
docker-compose restart frontend

# View logs for specific service
docker-compose logs -f backend

# Execute command in container
docker-compose exec backend sh

# Remove all containers and volumes
docker-compose down -v

# Scale services
docker-compose up --scale backend=3

# Check resource usage
docker stats
```

## Volume Management

Persistent data is stored in Docker volumes:

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect streamhub-advanced_postgres-data

# Backup database
docker-compose exec postgres pg_dump -U streamhub streamhub > backup.sql

# Restore database
docker-compose exec -T postgres psql -U streamhub streamhub < backup.sql
```

## Troubleshooting

### Frontend not loading
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up --build frontend
```

### Backend connection refused
```bash
# Check backend health
curl http://localhost:3000/health

# Check backend logs
docker-compose logs backend

# Verify network
docker network inspect streamhub-advanced_streamhub-network
```

### Database connection errors
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Connect to database
docker-compose exec postgres psql -U streamhub -d streamhub

# Check database logs
docker-compose logs postgres
```

### RTMP stream not working
```bash
# Test RTMP connection
ffmpeg -re -i test.mp4 -c copy -f flv rtmp://localhost:1935/live/stream

# Check backend RTMP logs
docker-compose logs backend | grep RTMP
```

## Performance Tuning

### For Production Use

1. **Update docker-compose.yml resources**:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

2. **Enable logging driver**:
```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

3. **Use production-ready database**:
- Change default passwords
- Enable SSL connections
- Configure automated backups
- Set up replication

## Security Considerations

- [ ] Change default database passwords
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS with reverse proxy (Nginx/Traefik)
- [ ] Restrict network access
- [ ] Enable database encryption
- [ ] Regular security updates
- [ ] Implement rate limiting
- [ ] Use secrets management (Docker Secrets/Vault)

## Next Steps

1. **Local Testing**: Verify all services work locally
2. **Cloud Deployment**: See [GCP_DEPLOYMENT.md](GCP_DEPLOYMENT.md)
3. **Monitoring**: Set up Prometheus/Grafana
4. **CI/CD**: Automate builds and deployments
5. **Scaling**: Implement load balancing

## Support

For issues and questions:
- Check [README.md](README.md) for project overview
- See [GCP_DEPLOYMENT.md](GCP_DEPLOYMENT.md) for cloud deployment
- Review logs with `docker-compose logs`

---

**Built for the AI Studio Era** 🎥
