# AI Feedback Management System

A comprehensive AI-powered feedback and complaint management system built with FastAPI and React. Features intelligent classification, automated workflows, real-time analytics, and AI-driven insights for enterprise HR and operations teams.

## 🌐 Live Demo

Experience the system in action:

- **Frontend**: [https://feedback.li-wei.net](https://feedback.li-wei.net)
- **API Docs**: [https://feedback_api.li-wei.net/docs](https://feedback_api.li-wei.net/docs)
- **Demo Credentials**:
  - Super Admin: `superadmin` / `superadmin123`
  - Admin: `admin` / `admin123`

## ✨ Key Features

### 🤖 AI-Powered Intelligence
- **Automatic Classification**: Groq LLM automatically categorizes complaints by department
- **Sentiment Analysis**: Real-time emotion detection (positive, neutral, negative)
- **AI Insights**: Deep analysis with root cause identification and recommendations
- **Smart Suggestions**: Context-aware response recommendations for admins
- **Interactive AI Chatbot**: Natural language interface for querying system data

### 📊 Analytics & Reporting
- **Real-time Dashboard**: Live metrics with trend visualization
- **Advanced Analytics**: Department performance, resolution times, SLA tracking
- **Interactive Charts**: Complaint trends, sentiment distribution, category breakdown
- **Automated Reports**: Weekly/monthly reports with customizable recipients
- **Export Capabilities**: Download reports in multiple formats

### 💼 Complaint Management
- **Public Submission Form**: Anonymous or authenticated complaint submission
- **File Attachments**: Upload images, videos, PDFs (10MB limit)
- **Priority Levels**: Normal, Urgent, Critical with automatic SLA assignment
- **Status Tracking**: Pending → In Progress → Resolved workflow
- **Reply System**: Admin responses with email notifications
- **Internal Notes**: Private notes for admin collaboration

### 🔐 Security & Access Control
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Role-Based Access**: Super Admin, Admin, and User roles
- **Department Isolation**: Admins see only their department's complaints
- **Password Hashing**: Bcrypt with configurable rounds
- **CORS Protection**: Configurable allowed origins

### 📧 Communication
- **Email Notifications**: Automatic emails on status changes and replies
- **HTML Templates**: Branded, responsive email templates
- **Retry Queue**: Failed email retry mechanism
- **SSE Updates**: Real-time browser notifications for new activities
- **Multi-recipient Reports**: Department-specific report distribution

### 🎨 User Experience
- **Modern UI**: Sleek, responsive design with Tailwind CSS
- **Dark/Light Mode**: User preference support
- **Mobile Responsive**: Works on all device sizes
- **Search & Filters**: Advanced filtering with saved presets
- **Pagination**: Efficient data loading for large datasets
- **Activity Timeline**: Visual history of all complaint activities

### 🔧 Administration
- **Department Management**: Create, edit, and organize departments
- **Employee Management**: User account management and role assignment
- **System Logs**: Comprehensive audit trails with correlation IDs
- **Configuration**: Environment-based settings for all features
- **Health Checks**: Built-in monitoring endpoints

## 📖 How to Use

### For End Users (Employees)

1. **Submit Feedback**:
   - Visit the public form: `https://feedback.li-wei.net/submit`
   - Fill in your details and describe the issue
   - Optionally attach files (images, documents)
   - Receive a tracking ID via email

2. **Track Status**:
   - Use your tracking ID to check complaint status
   - Receive email updates when admins respond
   - View admin replies and resolutions

### For Administrators

1. **Login**:
   - Navigate to `https://feedback.li-wei.net`
   - Use your admin credentials
   - Access role-appropriate features

2. **Dashboard Overview**:
   - View key metrics: total complaints, pending items, resolution rate
   - Monitor urgent complaints requiring immediate attention
   - Check SLA compliance and average response times
   - Review sentiment trends and category distribution

3. **Manage Complaints**:
   - **View All Complaints**: Browse all feedback with search and filters
   - **Filter Options**: By status, priority, category, date range, sentiment
   - **Saved Filters**: Save frequently used filter combinations
   - **Bulk Actions**: Change status for multiple items
   - **AI Assistance**: Get AI-powered insights and response suggestions

4. **Respond to Feedback**:
   - Open complaint details
   - Review AI-generated insights and recommendations
   - Add internal notes for team collaboration
   - Write public reply (sent via email to submitter)
   - Change status and priority as needed
   - Upload reference files if needed

5. **Analytics & Insights**:
   - **Analytics Page**: View comprehensive charts and trends
   - **Department Performance**: Compare metrics across departments
   - **AI Insights**: Deep dive into patterns and root causes
   - **Export Reports**: Download data for external analysis

6. **Reports**:
   - **Weekly Reports**: Automated summary emails every Monday
   - **Custom Reports**: Generate reports for specific date ranges
   - **Department Reports**: Filter by specific departments
   - **Export Options**: PDF, CSV, Excel formats

7. **AI Chatbot**:
   - Click the chatbot icon in the bottom right
   - Ask questions in natural language:
     - "How many urgent complaints this week?"
     - "Show me IT department statistics"
     - "What are the common issues in HR?"
   - Get instant insights from your data

8. **User Management** (Super Admin only):
   - Create new admin accounts
   - Assign users to departments
   - Manage user roles and permissions
   - Deactivate accounts when needed

### For Super Administrators

Additional capabilities:
- **Department Management**: Create, edit, delete departments
- **Employee Management**: Full user account control
- **System Configuration**: Access to all settings
- **Cross-Department View**: See all complaints across organization
- **Advanced Analytics**: Organization-wide insights and trends

## 🚀 Quick Start

### Option 1: Docker Deployment (Recommended)

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
uvicorn app.main:app --reload --port 8000
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

Access the application:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

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

| Variable | Description | Example |
| --- | --- | --- |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secure-random-key-here` |
| `GROQ_API_KEY` | Groq API key for AI features | `gsk_xxxxxxxxxxxxx` |
| `SMTP_USER` | SMTP username for emails | `apikey` (SendGrid) |
| `SMTP_PASS` | SMTP password/API key | `SG.xxxxxxxxxxxxx` |
| `CORS_ALLOW_ORIGINS` | Allowed CORS origins | `https://feedback.li-wei.net` |
| `EMAIL_FROM` | Sender email address | `noreply@yourcompany.com` |

### Optional Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `NODE_ENV` | Environment (development/production) | `development` |
| `JWT_EXPIRES_IN_MINUTES` | Access token TTL | `30` |
| `REFRESH_TOKEN_EXPIRES_IN_MINUTES` | Refresh token TTL | `10080` (7 days) |
| `SMTP_HOST` | SMTP server host | `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP server port | `587` |
| `UPLOAD_DIR` | File upload directory | `./uploads` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `10485760` (10MB) |
| `ALLOWED_FILE_TYPES` | Allowed MIME types | `image/jpeg,image/png,video/mp4,application/pdf` |
| `GROQ_MODEL` | Groq model name | `llama-3.3-70b-versatile` |
| `SLA_HOURS_NORMAL` | Normal priority SLA (hours) | `72` |
| `SLA_HOURS_URGENT` | Urgent priority SLA (hours) | `24` |
| `REPORT_DAY` | Weekly report day | `mon` |
| `REPORT_TIME` | Report generation time | `08:00` |
| `REPORT_TIMEZONE` | Timezone for scheduler | `UTC` |
| `LOG_FORMAT` | Log format (json/text) | `json` |

See `.env.docker` for a complete configuration template.

## 📚 API Documentation

### Core Endpoints

| Endpoint | Description |
| --- | --- |
| `GET /health` | Health check endpoint |
| `GET /docs` | Interactive API documentation (Swagger UI) |
| `POST /api/auth/login` | User authentication |
| `POST /api/auth/refresh` | Refresh access token |
| `GET /api/auth/verify` | Verify token validity |
| `POST /api/complaints` | Create new complaint (public) |
| `GET /api/complaints` | List complaints with filters |
| `GET /api/complaints/{id}` | Get complaint details |
| `PATCH /api/complaints/{id}` | Update complaint status |
| `POST /api/complaints/{id}/assist` | Get AI insights |
| `POST /api/replies` | Add admin reply |
| `GET /api/analytics` | Dashboard analytics |
| `GET /api/analytics/advanced` | Advanced analytics |
| `GET /api/reports/weekly` | Generate weekly report |
| `POST /api/files/upload` | Upload file attachment |
| `GET /api/files/{filename}` | Download file |
| `GET /api/departments` | List departments |
| `POST /api/chatbot/chat` | Chat with AI assistant |
| `GET /api/notifications/sse` | Server-sent events stream |

Full API documentation available at: `/docs` (Swagger UI) or `/redoc` (ReDoc)

### Authentication

All admin endpoints require JWT authentication:

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Use token in subsequent requests
curl http://localhost:8000/api/complaints \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🛠️ Technology Stack

### Backend
- **FastAPI** - High-performance async web framework
- **Python 3.11+** - Modern Python features
- **Pydantic** - Data validation and settings
- **Groq API** - AI-powered classification
- **APScheduler** - Background job scheduling
- **Bcrypt** - Password hashing
- **SMTP** - Email delivery
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Zustand** - State management
- **React Query** - Server state
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client routing
- **Axios** - HTTP client
- **Lucide Icons** - Icon library

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **Nginx** - Reverse proxy (optional)
- **Let's Encrypt** - SSL certificates

## 📁 Project Structure

```
feedback_system/
├── app/                      # FastAPI backend
│   ├── routers/             # API endpoints
│   │   ├── auth.py          # Authentication
│   │   ├── complaints.py    # Complaint CRUD
│   │   ├── analytics.py     # Analytics & metrics
│   │   ├── ai_insights.py   # AI-powered insights
│   │   ├── chatbot.py       # AI chatbot
│   │   ├── reports.py       # Report generation
│   │   ├── departments.py   # Department management
│   │   ├── notes.py         # Internal notes
│   │   └── notifications.py # Real-time updates
│   ├── services/            # Business logic
│   │   ├── ai.py            # AI classification
│   │   ├── email.py         # Email service
│   │   ├── analytics.py     # Analytics calculations
│   │   └── scheduler.py     # Background jobs
│   ├── config.py            # Configuration
│   ├── models.py            # Data models
│   ├── datastore.py         # Data access
│   └── main.py              # App entry point
├── frontend/                # React frontend
│   ├── src/
│   │   ├── pages/          # Page components
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── InsightsPage.tsx
│   │   │   ├── AllFeedbackPage.tsx
│   │   │   ├── UrgentPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   ├── DepartmentManagementPage.tsx
│   │   │   ├── EmployeesPage.tsx
│   │   │   └── SubmitComplaintPage.tsx
│   │   ├── components/     # Reusable components
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ComplaintTable.tsx
│   │   │   ├── ComplaintDetails.tsx
│   │   │   ├── ActivityTimeline.tsx
│   │   │   ├── FloatingChatbot.tsx
│   │   │   └── SearchFilterBar.tsx
│   │   ├── api/            # API client
│   │   ├── store/          # Zustand stores
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── vite.config.js
├── templates/               # Email templates
│   ├── email/
│   │   ├── base.txt
│   │   ├── reply.txt
│   │   └── weekly_report.txt
├── docs/                    # Documentation
│   ├── docker-deployment.md
│   ├── render-deployment.md
│   └── UI_COMPONENTS_GUIDE.md
├── Dockerfile               # Docker image
├── docker-compose.yml       # Docker orchestration
├── requirements.txt         # Python dependencies
├── .env.docker             # Env template
└── README.md               # This file
```

## 🔧 Architecture

### Backend Architecture
- **RESTful API** with automatic OpenAPI documentation
- **Async/await** for high-performance I/O operations
- **Dependency injection** for clean, testable code
- **Layered architecture**: Routes → Services → Datastore
- **Background tasks** with APScheduler
- **Structured logging** with correlation IDs
- **Health checks** for container orchestration

### Frontend Architecture
- **Component-based** with functional components
- **TypeScript** for type safety
- **State management**: Zustand for global state
- **Server state**: React Query for API data
- **Responsive design**: Mobile-first approach
- **Code splitting**: Lazy loading for performance

### Data Flow
1. User submits complaint via public form
2. Backend validates and stores data
3. AI service classifies complaint automatically
4. Email notification sent to submitter
5. Admin views complaint in dashboard
6. Admin adds reply → Email sent
7. Status changes trigger email notifications
8. Weekly reports generated automatically

## 🧪 Testing

### Health Check
```bash
curl http://localhost:8000/health
# Expected: {"status":"ok","environment":"production"}
```

### Test User Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Interactive API Testing
Visit `http://localhost:8000/docs` for Swagger UI with:
- Live API testing
- Request/response examples
- Schema documentation
- Authentication testing

## 🚢 Deployment Options

### Docker (Recommended)
Complete production-ready setup with persistent volumes and health checks.
- See [Docker Deployment Guide](docs/docker-deployment.md)
- Includes Nginx configuration
- SSL setup with Let's Encrypt
- Automated backups

### Manual VPS Deployment
Deploy on any Ubuntu/Debian VPS with Docker support.
- Follow the Docker guide
- Configure firewall rules
- Set up monitoring
- Configure log rotation

## 📈 Monitoring & Logs

### Application Logs
```bash
# Docker deployment
docker-compose logs -f feedback-app

# Local development
tail -f logs/app.log
```

### Log Format
Structured JSON logs with:
- `ts`: Timestamp
- `level`: INFO, WARNING, ERROR
- `message`: Log message
- `request_id`: Correlation ID
- Additional context (user_id, method, path)

### Health Monitoring
```bash
curl http://localhost:8000/health
```

### Performance Metrics
- Request latency tracking
- Background job monitoring
- Email delivery status
- AI service response times

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Check what's using the port
lsof -i :8000
# Change port in docker-compose.yml or stop conflicting service
```

**Database/file access errors**
```bash
# Check Docker volume permissions
docker-compose down
docker volume ls
docker-compose up -d
```

**Frontend build errors**
```bash
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

**Email not sending**
- Verify SMTP credentials in `.env`
- Check logs: `docker-compose logs -f`
- Ensure SMTP port not blocked
- Test with SendGrid/Mailgun

**AI features not working**
- Verify `GROQ_API_KEY` is set correctly
- Check API quota and limits
- Review logs for API errors
- Test API key separately

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Use meaningful commit messages
- Keep PRs focused and small

## 📋 Production Deployment Checklist

Before deploying to production:

- [ ] Change default admin password
- [ ] Generate secure `JWT_SECRET` (32+ characters)
- [ ] Configure SMTP credentials
- [ ] Set proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure automated backups
- [ ] Set up firewall rules
- [ ] Configure monitoring/alerting
- [ ] Adjust SLA hours for organization
- [ ] Configure report recipients
- [ ] Test email delivery
- [ ] Set up log rotation
- [ ] Document deployment config
- [ ] Test all critical workflows

## 📄 License

This project is proprietary software for internal use.

## 👥 Support

For issues and questions:
- Check the [Docker Deployment Guide](docs/docker-deployment.md)
- Review [API Documentation](https://feedback_api.li-wei.net/docs)
- Test with [Live Demo](https://feedback.li-wei.net)

## 🙏 Acknowledgments

Built with modern open-source technologies:
- FastAPI for high-performance backend
- React and Vite for modern frontend
- Groq for AI-powered insights
- Docker for containerization
- Tailwind CSS for beautiful UI

---

**Made with ❤️ by the development team**
