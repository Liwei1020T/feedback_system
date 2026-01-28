# Docker Deployment Guide

This guide explains how to deploy the AI Feedback Management System using Docker and Docker Compose on your VPS.

## Prerequisites

- A VPS with Docker and Docker Compose installed
- Domain name (optional but recommended)
- SMTP credentials for email notifications
- Groq API key for AI features

## Quick Start

### 1. Install Docker on VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Deploy Application

```bash
# Clone your repository
git clone <your-repo-url>
cd feedback

# Copy environment template
cp .env.docker .env

# Edit environment variables
nano .env
# Update the following:
# - JWT_SECRET (generate a secure random string)
# - GROQ_API_KEY (your Groq API key)
# - SMTP credentials
# - CORS_ALLOW_ORIGINS (your domain)
# - EMAIL_FROM (your sender email)
# - REPORT_RECIPIENTS_DEFAULT (admin emails)

# Build and start the application
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 3. Verify Deployment

```bash
# Check if container is running
docker-compose ps

# Test health endpoint
curl http://localhost:8000/health

# View logs
docker-compose logs -f feedback-app
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secure-random-key` |
| `GROQ_API_KEY` | Groq API key for AI features | `gsk_...` |
| `SMTP_USER` | SMTP username | `apikey` (for SendGrid) |
| `SMTP_PASS` | SMTP password/API key | `SG.xxx...` |
| `CORS_ALLOW_ORIGINS` | Allowed origins for CORS | `https://yourdomain.com` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `JWT_EXPIRES_IN_MINUTES` | `30` | Access token expiry |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | AI model |
| `MAX_FILE_SIZE` | `10485760` (10MB) | Max upload size |
| `SLA_HOURS_NORMAL` | `72` | Normal priority SLA |
| `SLA_HOURS_URGENT` | `24` | Urgent priority SLA |
| `REPORT_DAY` | `mon` | Weekly report day |
| `REPORT_TIME` | `08:00` | Report generation time |

## Reverse Proxy Setup (Nginx)

### Install Nginx

```bash
sudo apt install nginx -y
```

### Configure Nginx

Create `/etc/nginx/sites-available/feedback`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates (use certbot for Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # File upload size limit
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Enable site and restart Nginx

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/feedback /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Install SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

## Data Persistence

Data is stored in Docker volumes:

- `feedback-uploads`: User uploaded files
- `feedback-data`: Database JSON file
- `feedback-logs`: Application logs

### Backup Data

```bash
# Create backup directory
mkdir -p ~/backups

# Backup volumes
docker run --rm \
  -v feedback-data:/data \
  -v feedback-uploads:/uploads \
  -v ~/backups:/backup \
  alpine tar czf /backup/feedback-backup-$(date +%Y%m%d).tar.gz /data /uploads

# Backup to remote location (optional)
scp ~/backups/feedback-backup-*.tar.gz user@backup-server:/backups/
```

### Restore Data

```bash
# Stop application
docker-compose down

# Restore from backup
docker run --rm \
  -v feedback-data:/data \
  -v feedback-uploads:/uploads \
  -v ~/backups:/backup \
  alpine tar xzf /backup/feedback-backup-YYYYMMDD.tar.gz -C /

# Start application
docker-compose up -d
```

## Maintenance

### View Logs

```bash
# View all logs
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100

# View specific service
docker-compose logs -f feedback-app
```

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build

# Clean up old images
docker image prune -f
```

### Restart Application

```bash
# Restart service
docker-compose restart

# Or stop and start
docker-compose down
docker-compose up -d
```

### Check Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## Monitoring

### Check Health

```bash
# Health endpoint
curl http://localhost:8000/health

# Expected response:
# {"status":"ok","environment":"production"}
```

### Setup Monitoring (Optional)

Consider using:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Log aggregation**: Logstash, Papertrail
- **Metrics**: Prometheus + Grafana

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs feedback-app

# Check environment variables
docker-compose config

# Validate Docker Compose file
docker-compose config --quiet && echo "Valid" || echo "Invalid"
```

### Permission issues

```bash
# Fix volume permissions
docker-compose down
docker volume rm feedback-uploads feedback-data feedback-logs
docker-compose up -d
```

### High memory usage

```bash
# Restart container
docker-compose restart

# Set memory limits in docker-compose.yml:
# services:
#   feedback-app:
#     mem_limit: 1g
```

### Database corrupted

```bash
# Stop application
docker-compose down

# Remove data volume (WARNING: data loss)
docker volume rm feedback-data

# Start fresh
docker-compose up -d
```

## Security Best Practices

1. **Change default secrets**
   - Generate strong `JWT_SECRET`
   - Use environment-specific credentials

2. **Use HTTPS**
   - Always use SSL certificates in production
   - Configure proper CORS origins

3. **Firewall Configuration**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

4. **Regular Updates**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y

   # Update Docker images
   docker-compose pull
   docker-compose up -d
   ```

5. **Backup Regularly**
   - Schedule automated backups
   - Test restore procedures

## Performance Tuning

### For production environments:

1. **Increase workers** (add to Dockerfile CMD):
   ```dockerfile
   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
   ```

2. **Enable response caching** in Nginx

3. **Configure log rotation**:
   ```bash
   # Create /etc/logrotate.d/docker-containers
   /var/lib/docker/containers/*/*.log {
       rotate 7
       daily
       compress
       size=10M
       missingok
       delaycompress
       copytruncate
   }
   ```

## Support

For issues and questions:
- Check logs: `docker-compose logs -f`
- Review environment variables: `docker-compose config`
- Consult main README.md for API documentation
