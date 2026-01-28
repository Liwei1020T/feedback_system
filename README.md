# Jabil Feedback System

A full-stack AI-powered feedback management system built with FastAPI and React. Features intelligent complaint classification, automated routing, real-time analytics, and comprehensive reporting capabilities.

## 🚀 Quick Start

### Option 1: Docker Deployment (Recommended for Production)

```bash
# Clone the repository
git clone https://github.com/Liwei1020T/feedback_system.git
cd feedback_system

# Configure environment variables
cp .env.docker .env
nano .env  # Edit with your actual values

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f
```

The application will be available at `http://localhost:8000`. See [Docker Deployment Guide](docs/docker-deployment.md) for detailed instructions.

### Option 2: Local Development

**Backend Setup:**
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

> **Note:** Copy `.env.example` to `.env` and configure required secrets (GROQ_API_KEY, SMTP credentials, etc.)

## 📋 Prerequisites

### For Docker Deployment
- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum, 4GB recommended
- 20GB disk space

### For Local Development
- Python 3.11+
- Node.js 18+
- npm or yarn

## ⚙️ Configuration

### Required Environment Variables

| Variable | Description | Required |
| --- | --- | --- |
| `JWT_SECRET` | Secret key for JWT tokens | ✅ |
| `GROQ_API_KEY` | Groq API key for AI features | ✅ |
| `SMTP_USER` | SMTP username for emails | ✅ |
| `SMTP_PASS` | SMTP password/API key | ✅ |
| `CORS_ALLOW_ORIGINS` | Allowed CORS origins | ✅ |

### Optional Environment Variables

Key settings (with defaults) can be overridden via the environment:

| Variable | Description | Default |
| --- | --- | --- |
| `NODE_ENV` | Environment label | `development` |
| `JWT_SECRET` | Token signing secret | `dev-secret-key` |
| `JWT_EXPIRES_IN_MINUTES` | Access token TTL | `30` |
| `REFRESH_TOKEN_EXPIRES_IN_MINUTES` | Refresh token TTL | `10080` |
| `EMAIL_FROM` | Sender email address | `noreply@company.com` |
| `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` | Email provider settings | SendGrid defaults |
| `UPLOAD_DIR` | Attachment storage path | `./uploads` |
| `ALLOWED_FILE_TYPES` | CSV of MIME types | `image/jpeg,image/png,video/mp4,application/pdf` |
| `MAX_FILE_SIZE` | Upload limit in bytes | `10485760` |
| `GROQ_API_KEY` | Groq API key for AI features | _required for AI_ |
| `GROQ_MODEL` | Groq model name | `llama-3.3-70b-versatile` |
| `CORS_ALLOW_ORIGINS` | Comma-separated origins allowed by CORS | `http://localhost:5173` |
| `CORS_ALLOW_ORIGIN_REGEX` | Optional Python regex that matches allowed origins (takes precedence over the list) | _unset_ |
| `BCRYPT_ROUNDS` | Bcrypt cost factor (security vs CPU) | `12` |
| `LOG_FORMAT` | `json` or `text` log output | `json` |
| `REQUEST_ID_HEADER` | Header name used for request correlation | `X-Request-ID` |
| `SLA_HOURS_NORMAL` | SLA target (hours) for normal-priority feedback | `72` |
| `SLA_HOURS_URGENT` | SLA target (hours) for urgent-priority feedback | `24` |
| `REPORT_SCHEDULE_CRON` | Optional cron expression overriding day/time | _unset_ |
| `REPORT_DAY` | Day of week to generate weekly report (`mon`-`sun`) | `mon` |
| `REPORT_TIME` | Local time (HH:MM) for weekly report job | `08:00` |
| `REPORT_TIMEZONE` | IANA timezone for scheduler | `UTC` |
| `REPORT_RECIPIENTS_DEFAULT` | CSV of email recipients for weekly report | _unset_ |
| `REPORT_RECIPIENTS_<DEPT>` | Dept-specific weekly report recipients | _unset_ |

## 📚 API Documentation

### Core Endpoints

| Endpoint | Description |
| --- | --- |
| `GET /health` | Health check endpoint |
| `GET /docs` | Interactive API documentation (Swagger UI) |
| `/api/auth` | Authentication (login, refresh, logout, verify) |
| `/api/complaints` | Complaint CRUD with AI classification |
| `/api/replies` | Admin responses with email notifications |
| `/api/analytics` | Dashboard metrics and trends |
| `/api/reports` | Weekly/monthly/yearly report generation |
| `/api/files` | File upload/download with validation |
| `/api/departments` | Department management |
| `/api/profile` | User profile and preferences |

### Features

- **AI-Powered Classification**: Automatic complaint categorization using Groq LLM
- **Smart Routing**: Intelligent assignment based on department and priority
- **Real-time Analytics**: Live dashboards with trend analysis
- **Email Notifications**: Branded HTML emails with retry queue
- **Filter Presets**: Save and reuse custom filter combinations
- **Weekly Reports**: Automated scheduled reports with customizable recipients
- **File Attachments**: Secure upload/download with validation
- **Audit Logging**: Comprehensive request tracking with correlation IDs

### Default Credentials

- Username: `admin`
- Password: `admin123`

> ⚠️ **Security**: Change the default admin password immediately in production!

## 🧪 Testing

### Health Check
```bash
curl http://localhost:8000/health
```

### Run Tests
```bash
pytest
```

### API Documentation
Visit `http://localhost:8000/docs` for interactive Swagger UI documentation.

## 🚢 Deployment Options

### Docker (Recommended)
Complete production-ready setup with persistent volumes and health checks.
- See [Docker Deployment Guide](docs/docker-deployment.md)

### Render.com
Platform-as-a-Service deployment with automatic builds.
- See [Render Deployment Guide](docs/render-deployment.md)

### Manual VPS Deployment
Deploy on any Ubuntu/Debian VPS with Docker support.
- Includes Nginx reverse proxy configuration
- SSL certificate setup with Let's Encrypt
- Automated backups and monitoring

## ✨ Key Features

- 🤖 **AI-Powered Analysis**: Automatic classification and sentiment analysis using Groq LLM
- 📊 **Real-time Analytics**: Live dashboards with trend visualization and SLA tracking
- 📎 **File Attachments**: Secure upload/download with type validation and size limits
- 🔐 **Role-based Access**: JWT authentication with admin/user roles
- 📧 **Email Notifications**: Branded HTML emails with retry queue and templates
- 🎯 **Smart Routing**: Intelligent complaint assignment based on category and priority
- 💾 **Filter Presets**: Save and reuse custom filter combinations
- 📅 **Scheduled Reports**: Automated weekly reports with department-specific recipients
- 🎨 **Modern UI**: Responsive design with Tailwind CSS and smooth animations
- 📝 **Audit Logging**: Comprehensive request tracking with correlation IDs

## 🛠️ Technology Stack

### Backend
| Technology | Purpose |
| --- | --- |
| **FastAPI** | High-performance async web framework |
| **Python 3.11+** | Modern Python features and performance |
| **Pydantic** | Data validation and settings management |
| **Groq API** | AI-powered complaint classification |
| **APScheduler** | Background job scheduling |
| **Bcrypt** | Password hashing and security |
| **SMTP** | Email delivery (SendGrid/custom) |
| **Uvicorn** | ASGI server with auto-reload |

### Frontend
| Technology | Purpose |
| --- | --- |
| **React 18** | Modern UI library with hooks |
| **TypeScript** | Type-safe development |
| **Vite** | Fast build tool and dev server |
| **Zustand** | Lightweight state management |
| **React Query** | Server state management |
| **Tailwind CSS** | Utility-first styling |
| **React Router** | Client-side routing |
| **Axios** | HTTP client |

### DevOps
| Technology | Purpose |
| --- | --- |
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **Nginx** | Reverse proxy (optional) |
| **Let's Encrypt** | SSL certificates |

## 📁 Project Structure

```
feedback_system/
├── app/                      # FastAPI backend
│   ├── routers/             # API route handlers
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── complaints.py    # Complaint CRUD operations
│   │   ├── analytics.py     # Analytics and metrics
│   │   ├── reports.py       # Report generation
│   │   └── ...
│   ├── services/            # Business logic layer
│   │   ├── ai.py            # AI classification service
│   │   ├── email.py         # Email notification service
│   │   ├── analytics.py     # Analytics calculations
│   │   └── ...
│   ├── config.py            # Configuration management
│   ├── models.py            # Data models
│   ├── datastore.py         # Data access layer
│   └── main.py              # Application entry point
├── frontend/                # React frontend
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── store/          # State management (Zustand)
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── vite.config.js
├── templates/               # Email templates
├── docs/                    # Documentation
│   ├── docker-deployment.md
│   └── render-deployment.md
├── Dockerfile               # Docker image definition
├── docker-compose.yml       # Docker orchestration
├── requirements.txt         # Python dependencies
└── .env.example            # Environment template
```

## 🔧 Architecture

### Backend (FastAPI)
- **RESTful API** with automatic OpenAPI documentation
- **Async/await** support for high performance
- **Dependency injection** for clean architecture
- **Background tasks** with APScheduler for weekly reports
- **Structured logging** with correlation IDs (JSON format)
- **Health checks** for container orchestration

### Frontend (React + Vite)
- **Component-based** architecture with TypeScript
- **State management** using Zustand
- **API integration** with React Query
- **Responsive design** with Tailwind CSS
- **Client-side routing** with React Router

### Data Persistence
- **JSON file store** (development/demo)
- **Volume mounts** for Docker deployment
- Easily replaceable with PostgreSQL/MySQL

## 🛠️ Development

### Project Scripts

```bash
# Backend
uvicorn app.main:app --reload    # Start dev server
pytest                           # Run tests
python -m pip freeze            # List dependencies

# Frontend
npm run dev                      # Start dev server
npm run build                    # Production build
npm run lint                     # Lint code

# Docker
docker-compose up -d             # Start containers
docker-compose logs -f           # View logs
docker-compose down              # Stop containers
```

### Adding New Features

1. **Backend**: Add routes in `app/routers/`, business logic in `app/services/`
2. **Frontend**: Add components in `frontend/src/components/`, pages in `frontend/src/pages/`
3. **API Client**: Update `frontend/src/api/` with new endpoints
4. **Types**: Add TypeScript types in `frontend/src/types/`

## 📈 Monitoring & Logs

### Application Logs
```bash
# Docker deployment
docker-compose logs -f

# Local development
tail -f logs/app.log
```

Logs are in JSON format with structured fields:
- `ts`: Timestamp
- `level`: Log level (INFO, WARNING, ERROR)
- `message`: Log message
- `request_id`: Correlation ID for request tracking
- Additional context fields (user_id, method, path, etc.)

### Health Monitoring
```bash
# Check application health
curl http://localhost:8000/health

# Expected response
{"status":"ok","environment":"production"}
```

### Performance Metrics
- Request tracking with correlation IDs
- Latency logging for all API calls
- Background job execution monitoring

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Check what's using the port
lsof -i :8000
# Change port in docker-compose.yml or stop conflicting service
```

**Database connection errors**
```bash
# Check volume permissions
docker-compose down
docker volume ls
docker-compose up -d
```

**Frontend build errors**
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

**Email not sending**
- Verify SMTP credentials in `.env`
- Check logs for email service errors
- Ensure SMTP port is not blocked by firewall

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Use meaningful commit messages

## 📋 Production Deployment Checklist

Before deploying to production, ensure you:

- [ ] Change default admin password
- [ ] Generate secure `JWT_SECRET` (32+ random characters)
- [ ] Configure SMTP credentials for email notifications
- [ ] Set up proper CORS origins for your domain
- [ ] Configure SSL/TLS certificates (Let's Encrypt)
- [ ] Set up automated backups for data volumes
- [ ] Configure firewall rules (ports 80, 443, 22 only)
- [ ] Set up monitoring and alerting
- [ ] Review and adjust SLA hours for your needs
- [ ] Configure weekly report recipients
- [ ] Test email delivery
- [ ] Set up log rotation
- [ ] Document your deployment configuration

## 📄 License

This project is proprietary software for Jabil internal use.

## 👥 Support

For issues and questions:
- Check the [Docker Deployment Guide](docs/docker-deployment.md)
- Review [API Documentation](http://localhost:8000/docs)
- Contact the development team

## 🙏 Acknowledgments

Built with modern open-source technologies:
- FastAPI for the high-performance backend
- React and Vite for the modern frontend
- Groq for AI-powered classification
- Docker for containerization

---

**Made with ❤️ for Jabil**
