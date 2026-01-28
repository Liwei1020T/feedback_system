# Quick Start Guide - Docker Deployment with Demo Data

Get the Feedback Management System running in under 5 minutes with pre-populated demo data.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM available
- Port 8000 available

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone and Configure

```bash
# Clone the repository
git clone <repository-url>
cd feedback

# Copy environment file
cp .env.docker .env

# Edit the .env file with your settings (optional for demo)
nano .env
```

### Step 2: Start the System

```bash
# Build and start with demo data (default)
docker-compose up -d

# Watch the startup logs
docker-compose logs -f
```

### Step 3: Verify Deployment

```bash
# Make scripts executable
chmod +x scripts/test_demo_data.sh

# Run the verification script
./scripts/test_demo_data.sh
```

Expected output:
```
✓ Container is running
✓ Application is ready
✓ Login successful
✓ Found 10 users
✓ Found 12+ complaints
✓ Demo data setup verified successfully!
```

### Step 4: Access the Application

Open your browser:
- **Frontend**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Step 5: Login and Explore

Use any of these demo accounts:

| Username | Password | Role | Department |
|----------|----------|------|------------|
| `superadmin` | `superadmin123` | Super Admin | All Access |
| `admin` | `admin123` | Admin | IT Department |
| `it_lead` | `temps3cret` | Admin | IT Department |
| `payroll_lead` | `temps3cret` | Admin | Payroll |
| `facilities_lead` | `temps3cret` | Admin | Facilities |

## 📊 What's Included in Demo Data

### Users (10+)
- Super Admin and department admins
- Distributed across IT, HR, Payroll, Facilities, Safety departments
- Multiple plants (P1, P2, BK)

### Complaints (12+)
- **IT Issues**: Laptop problems, network access, printer jams
- **Facilities**: AC problems, lighting, parking safety
- **Payroll**: Salary discrepancies, overtime calculations
- **HR**: Leave applications, benefits inquiries
- **Safety**: Fire extinguishers, workplace hazards
- **Feedback**: Positive employee feedback

### Other Data
- Replies and email notifications
- Internal notes between admins
- Various statuses (Pending, In Progress, Resolved)
- Different priorities (Normal, Urgent)
- AI confidence scores
- Timestamps spread over last 4 days

## 🎯 Common Tasks

### View All Complaints

```bash
# Via API
curl http://localhost:8000/api/complaints

# With authentication
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/complaints
```

### Check System Health

```bash
curl http://localhost:8000/health
```

### View Logs

```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs feedback-app
```

### Access Database File

```bash
# View database content
docker exec feedback-app cat /app/data/db.json | jq

# Backup database
docker cp feedback-app:/app/data/db.json ./backup-db.json

# Check database size
docker exec feedback-app ls -lh /app/data/db.json
```

## 🛠️ Customization

### Disable Demo Data

```bash
# Set environment variable
export SEED_DEMO_DATA=false

# Or in docker-compose.override.yml
echo 'version: "3.8"
services:
  feedback-app:
    environment:
      - SEED_DEMO_DATA=false' > docker-compose.override.yml

# Restart
docker-compose down
docker-compose up -d
```

### Add More Demo Data

```bash
# Run the enhanced seeding script
docker exec feedback-app python scripts/seed_demo_data.py
```

### Reset Demo Data

```bash
# Stop container
docker-compose down

# Remove data volume
docker volume rm feedback_feedback-data

# Start fresh (demo data will be recreated)
docker-compose up -d
```

### Custom Plants Configuration

```bash
# Edit .env file
PLANTS=Factory1,Factory2,Warehouse,HQ

# Restart
docker-compose restart
```

## 🔧 Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker-compose logs feedback-app

# Verify port 8000 is available
lsof -i :8000

# Rebuild container
docker-compose down
docker-compose up -d --build
```

### No Demo Data Appearing

```bash
# Check environment variable
docker exec feedback-app env | grep SEED_DEMO

# Verify database file
docker exec feedback-app ls -lh /app/data/

# Check startup logs
docker-compose logs feedback-app | grep -i "seed\|demo"
```

### Database File Not Found

```bash
# Verify volume is mounted
docker volume inspect feedback_feedback-data

# Check directory permissions
docker exec feedback-app ls -la /app/data/

# Recreate volume
docker-compose down -v
docker-compose up -d
```

### Application Not Responding

```bash
# Check health status
docker-compose ps

# Check resource usage
docker stats feedback-app

# Restart container
docker-compose restart
```

### Login Fails

```bash
# Verify admin user exists
docker exec feedback-app python -c "
from app.datastore import InMemoryDB
db = InMemoryDB()
users = db.list_users()
for u in users:
    print(f'{u.username}: {u.role} ({u.department})')
"

# Reset admin password
docker exec -it feedback-app python scripts/reset_password.py admin
```

## 📦 Updating

### Pull Latest Changes

```bash
# Pull latest code
git pull origin main

# Rebuild container
docker-compose down
docker-compose up -d --build
```

### Backup Before Update

```bash
# Backup database
docker cp feedback-app:/app/data/db.json ./backup-$(date +%Y%m%d).json

# Backup uploads
docker cp feedback-app:/app/uploads ./backup-uploads-$(date +%Y%m%d)
```

## 🔐 Security Notes for Demo

**⚠️ WARNING**: Demo data includes default passwords!

Before production use:

1. **Change All Passwords**:
   ```bash
   docker exec -it feedback-app python
   >>> from app.datastore import InMemoryDB
   >>> db = InMemoryDB()
   >>> db.update_user_password(1, "new-secure-password")
   ```

2. **Disable Demo Data**:
   ```bash
   SEED_DEMO_DATA=false docker-compose up -d
   ```

3. **Set Strong JWT Secret**:
   ```bash
   # Generate secure secret
   openssl rand -hex 32

   # Add to .env
   JWT_SECRET=<generated-secret>
   ```

4. **Configure Production CORS**:
   ```bash
   CORS_ALLOW_ORIGINS=https://your-domain.com
   ```

## 📚 Next Steps

- **Explore Features**: Try all the demo accounts to see different permissions
- **Test Workflows**: Create complaints, assign them, add replies
- **Check Analytics**: View the dashboard with pre-populated data
- **API Testing**: Use the Swagger UI at http://localhost:8000/docs
- **Customize**: Modify demo data in `app/datastore.py` and rebuild

## 🆘 Support

- **Documentation**: See [README.md](README.md) and [DEMO_DATA.md](DEMO_DATA.md)
- **Logs**: Check `docker-compose logs` for detailed error messages
- **API Docs**: http://localhost:8000/docs for endpoint reference
- **Health Check**: http://localhost:8000/health for system status

## 🎉 Success!

You now have a fully functional Feedback Management System with demo data running locally. Start exploring the features and customizing for your needs!
