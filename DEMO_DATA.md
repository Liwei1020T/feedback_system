# Demo Data Guide

This guide explains the demo data seeding system for the Feedback Management System.

## Overview

The system automatically seeds demo data on first deployment to help you explore the application's features immediately. Demo data includes:

- **Default Admin Users**: Pre-configured accounts for different departments
- **Sample Complaints**: Realistic complaints across all categories (IT, HR, Payroll, Facilities, Safety)
- **Replies & Notes**: Sample responses and internal communications
- **Various Statuses**: Examples of pending, in-progress, and resolved items
- **Multi-plant Data**: Data distributed across P1, P2, and BK plants

## Quick Start

### Docker Deployment with Demo Data (Default)

```bash
# Build and start with demo data (default behavior)
docker-compose up -d

# Or explicitly enable demo data
SEED_DEMO_DATA=true docker-compose up -d
```

### Docker Deployment without Demo Data

```bash
# Disable demo data seeding
SEED_DEMO_DATA=false docker-compose up -d
```

### Check Container Status

```bash
# View logs during startup
docker-compose logs -f feedback-app

# Check health status
docker-compose ps
```

## Default Admin Accounts

After deployment, you can log in with these accounts:

| Username | Password | Role | Department | Plant |
|----------|----------|------|------------|-------|
| `superadmin` | `superadmin123` | Super Admin | Executive | All |
| `admin` | `admin123` | Admin | IT | P1 |
| `it_lead` | `temps3cret` | Admin | IT | All |
| `payroll_lead` | `temps3cret` | Admin | Payroll | P1 |
| `facilities_lead` | `temps3cret` | Admin | Facilities | P1 |
| `facilities_p2` | `temps3cret` | Admin | Facilities | P2 |
| `safety_officer` | `temps3cret` | Admin | Safety | P1 |
| `hr_manager` | `temps3cret` | Admin | HR | P1 |

**⚠️ IMPORTANT**: Change these passwords immediately in production!

## Demo Data Content

### Default Seeded Data (Built-in)

The system automatically creates on first startup:

**Categories (6)**:
- IT (Information Technology)
- HR (Human Resources)
- Payroll (Salary and Payment)
- Facilities (Office Facilities)
- Safety (Workplace Safety)
- Unclassified (Needs Manual Classification)

**Sample Complaints (12+)**:
- IT issues (laptop problems, access issues, printer jams)
- Facilities problems (AC, lighting, parking)
- Payroll discrepancies (overtime, salary calculations)
- HR inquiries (leave applications, benefits)
- Safety concerns (fire extinguishers, hazards)
- Positive feedback examples

**Realistic Details**:
- Distributed across all three plants (P1, P2, BK)
- Various priorities (normal, urgent)
- Different statuses (pending, in-progress, resolved)
- AI confidence scores (0.75-0.95)
- Timestamps spread over the last 4 days
- Some with replies and attachments

### Enhanced Demo Data (Optional Script)

For even more comprehensive demo data, you can run the optional seeding script:

```bash
# From within the container
docker exec -it feedback-app python scripts/seed_demo_data.py

# Or from the host (if you have Python environment)
python scripts/seed_demo_data.py
```

This adds:
- Additional users across different roles
- 50+ diverse complaints
- Multiple replies per complaint
- Internal notes
- Notifications for admins

## Data Storage

Demo data is stored in a persistent volume:

```yaml
volumes:
  - feedback-data:/app/data  # Contains db.json
```

### Resetting Demo Data

To start fresh with new demo data:

```bash
# Stop the container
docker-compose down

# Remove the data volume
docker volume rm feedback_feedback-data

# Start again (demo data will be recreated)
docker-compose up -d
```

### Backing Up Data

```bash
# Create a backup of the database
docker cp feedback-app:/app/data/db.json ./backup-db.json

# Restore from backup
docker cp ./backup-db.json feedback-app:/app/data/db.json
docker-compose restart
```

## Exploring Demo Features

### 1. Dashboard & Analytics
- Log in as `superadmin` to see system-wide analytics
- View distribution across plants and categories
- Check resolution times and SLA compliance

### 2. Department-Specific Views
- Log in as department admins (e.g., `it_lead`, `facilities_lead`)
- See only complaints assigned to your department
- Practice assigning, replying, and resolving complaints

### 3. Multi-Plant Management
- Switch between plant filters (P1, P2, BK)
- Test cross-plant coordination scenarios
- View plant-specific reports

### 4. AI Features
- Review AI-suggested categories
- Check confidence scores
- Test sentiment analysis on different complaint types

### 5. Workflow Testing
- Move complaints through status lifecycle (Pending → In Progress → Resolved)
- Add replies with email notifications
- Create internal notes with mentions
- Upload attachments to complaints

## Environment Variables

Control demo data behavior:

```bash
# Enable/disable demo data seeding
SEED_DEMO_DATA=true          # Default: true

# Database location
DATA_STORE_PATH=/app/data/db.json

# Plants configuration
PLANTS=P1,P2,BK              # Default plant codes
```

## Production Considerations

### Before Going to Production

1. **Disable Demo Data Seeding**:
   ```bash
   SEED_DEMO_DATA=false
   ```

2. **Change Default Passwords**:
   - Log in with default accounts
   - Navigate to user settings
   - Update passwords immediately

3. **Remove Demo Users** (Optional):
   - Delete unnecessary demo accounts
   - Keep only required admin accounts

4. **Configure Production Settings**:
   ```bash
   JWT_SECRET=<strong-random-secret>
   GROQ_API_KEY=<your-production-key>
   SMTP_HOST=<your-smtp-server>
   SMTP_USER=<your-email>
   SMTP_PASS=<your-password>
   ```

5. **Set Up Proper CORS**:
   ```bash
   CORS_ALLOW_ORIGINS=https://your-domain.com
   ```

## Troubleshooting

### Demo Data Not Appearing

```bash
# Check if database file exists
docker exec feedback-app ls -lh /app/data/

# View startup logs
docker-compose logs feedback-app | grep -i "seed\|demo"

# Verify environment variable
docker exec feedback-app env | grep SEED_DEMO
```

### Reset to Clean State

```bash
# Complete cleanup and restart
docker-compose down -v
docker-compose up -d --build
```

### Check Data Volume

```bash
# List volumes
docker volume ls | grep feedback

# Inspect volume
docker volume inspect feedback_feedback-data
```

## Demo Data Schema

The demo data follows this structure in `db.json`:

```json
{
  "counters": {
    "user": 12,
    "complaint": 20,
    "category": 6,
    "reply": 15,
    "attachment": 2
  },
  "users": [...],
  "complaints": [...],
  "categories": [...],
  "replies": [...],
  "attachments": [...],
  "reports": [...],
  "audit_logs": [...],
  "notifications": [...]
}
```

## Additional Resources

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Frontend**: http://localhost:8000/

## Support

For issues or questions:
1. Check the application logs: `docker-compose logs -f`
2. Verify environment variables: `docker exec feedback-app env`
3. Review the README.md in the project root
