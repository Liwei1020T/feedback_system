# Jabil Feedback System

## 1. System Overview

### 1.1 Purpose
A comprehensive feedback management platform that leverages AI for automated classification, summarization, and efficient feedback resolution with email notifications.

### 1.2 Key Features
- User portal for complaint submission
- Admin dashboard for complaint management
- AI-driven complaint classification
- Automated report generation
- Configurable email notification system
- Real-time analytics and reporting

---

## 2. System Architecture

### 2.1 Layered Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
├─────────────────┬───────────────────┬──────────────────────┤
│   Login Page    │   User Portal     │   Admin Dashboard    │
│   - User        │   - Submit Form   │   - View All         │
│   - Admin       │   - File Upload   │   - Reply System     │
│                 │   - Validation    │   - Analytics        │
└─────────────────┴───────────────────┴──────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
├─────────────────┬───────────────────┬──────────────────────┤
│  Authentication │  Complaint Mgmt   │   Reporting          │
│  - Login Logic  │  - CRUD Ops       │   - Summary Gen      │
│  - Session Mgmt │  - Status Update  │   - Analytics        │
└─────────────────┴───────────────────┴──────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     AI/ML Services Layer                     │
├─────────────────┬───────────────────┬──────────────────────┤
│ Classification  │  Summarization    │   Priority Detection │
│ - Category      │  - Weekly         │   - Urgent Flag      │
│ - Confidence    │  - Monthly        │   - Normal           │
│                 │  - Yearly         │                      │
└─────────────────┴───────────────────┴──────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Integration Layer                        │
├─────────────────┬───────────────────┬──────────────────────┤
│  Email Service  │  File Storage     │   Anthropic Claude   │
│  - SMTP         │  - Cloud/Local    │   - API Integration  │
│  - Templates    │  - Attachments    │   - Token Mgmt       │
└─────────────────┴───────────────────┴──────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
├─────────────────┬───────────────────┬──────────────────────┤
│   Database      │   File Storage    │   Cache              │
│   - Complaints  │   - Images        │   - Session          │
│   - Users       │   - Videos        │   - Temp Data        │
│   - Replies     │   - Documents     │                      │
└─────────────────┴───────────────────┴──────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend
```
Framework: React 18+
UI Library: Tailwind CSS
Charts: Recharts
Icons: Lucide React
State Management: React Hooks (useState, useEffect)
Routing: React Router (optional)
```

### 3.2 Backend (Recommended)
```
Runtime: Node.js 18+
Framework: Express.js / Fastify
Language: TypeScript or JavaScript
API Architecture: RESTful
```

### 3.3 Database
```
Primary: PostgreSQL / MySQL
Key Schemas: users, complaints, replies, categories, audit_logs
```

### 3.4 AI/ML Integration
```
Provider: Anthropic Claude API
Model: Claude Sonnet 4
Features: Text Classification, Summarization, Sentiment (optional)
```

### 3.5 Email Services
```
SendGrid / AWS SES / Nodemailer
Supports transactional templates and delivery tracking
```

### 3.6 File Storage
```
AWS S3, Google Cloud Storage, Azure Blob, or local dev storage
```

---

## 4. Database Schema

### 4.1 Users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Complaints
```sql
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    emp_id VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    complaint_text TEXT NOT NULL,
    category VARCHAR(50),
    priority VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Pending',
    ai_confidence FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    assigned_to INTEGER REFERENCES users(id)
);
```

### 4.3 Attachments
```sql
CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.4 Replies
```sql
CREATE TABLE replies (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    admin_id INTEGER REFERENCES users(id),
    reply_text TEXT NOT NULL,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.5 Categories
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name, description) VALUES
('HR', 'Human Resources related complaints'),
('Payroll', 'Salary and payment issues'),
('Facilities', 'Office facilities and maintenance'),
('IT', 'Information Technology and systems'),
('Safety', 'Workplace safety concerns'),
('Unclassified', 'Complaints that need manual classification');
```

### 4.6 Audit Logs
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. API Endpoints

### 5.1 Authentication
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
GET  /api/auth/verify
```

### 5.2 Complaints
```
POST   /api/complaints
GET    /api/complaints
GET    /api/complaints/:id
PUT    /api/complaints/:id
DELETE /api/complaints/:id
GET    /api/complaints/category/:category
GET    /api/complaints/status/:status
POST   /api/complaints/:id/classify
```

### 5.3 Replies
```
POST   /api/replies
GET    /api/replies/:complaintId
PUT    /api/replies/:id
DELETE /api/replies/:id
```

### 5.4 Analytics & Reports
```
GET  /api/analytics/dashboard
GET  /api/analytics/summary
GET  /api/analytics/trends
POST /api/reports/generate
GET  /api/reports/:id
```

### 5.5 File Upload
```
POST   /api/upload
GET    /api/files/:id
DELETE /api/files/:id
```

---

## 6. AI Integration Flow

### 6.1 Classification Flow
```
User submits complaint
        ↓
Frontend sends payload
        ↓
Backend receives text
        ↓
Call Anthropic Claude API
        ↓
Prompt requests category/priority
        ↓
Claude returns JSON {category, priority, confidence}
        ↓
Confidence < 0.7 ⇒ "Unclassified"
        ↓
Persist to DB with AI metadata
        ↓
Return result to frontend
```

### 6.2 Classification Prompt
```javascript
const classificationPrompt = `
You are a complaint classification system. Analyze the following complaint and return ONLY a JSON object.

Categories: HR, Payroll, Facilities, IT, Safety, Other
Priority: normal, urgent

Complaint: "${complaintText}"

Return format:
{
  "category": "category_name",
  "priority": "normal or urgent",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}
`;
```

### 6.3 Report Summarization Flow
```
Admin requests summary
        ↓
Backend fetches complaints for period
        ↓
Aggregate data by category/status
        ↓
Call Anthropic Claude API
        ↓
Prompt requests executive summary
        ↓
Claude returns summary
        ↓
Store in cache/database
        ↓
Serve to admin dashboard
```

### 6.4 Summary Prompt
```javascript
const summaryPrompt = `
Generate an executive summary for the following complaint data for ${period}.

Data:
Total Complaints: ${total}
Resolved: ${resolved}
Pending: ${pending}
Categories: ${JSON.stringify(categoryBreakdown)}

Provide:
1. Key trends
2. Most common issues
3. Recommendations
4. Action items

Keep it concise (3-4 paragraphs).
`;
```

---

## 7. Email System

### 7.1 Templates

#### New Complaint Confirmation
```html
Subject: Your Feedback Has Been Received - Feedback #{{complaintId}}

Dear {{employeeName}},

Thank you for submitting your complaint. We have received it and our team will review it shortly.

Complaint Details:
- Feedback ID: {{complaintId}}
- Category: {{category}}
- Date Submitted: {{date}}

You will receive a response via email within 48 hours.

Best regards,
HR Department
```

#### Admin Reply Template
```html
Subject: Response to Your Feedback - Feedback #{{complaintId}}

Dear {{employeeName}},

We have reviewed your complaint and would like to provide the following response:

{{replyText}}

If you have any further questions, please don't hesitate to contact us.

Best regards,
{{adminName}}
HR Department
```

### 7.2 Service Configuration Example
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmail(to, subject, html) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html
  });
}
```

---

## 8. Security Considerations

### 8.1 Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt (12+ rounds)
- Session expiration (30 minutes idle)
- Refresh token rotation

### 8.2 Data Protection
- Input validation and sanitization
- Parameterized queries
- XSS/CSRF protection
- Rate limiting
- File upload validation (type, size, malware)

### 8.3 API Security
- HTTPS-only transport
- API key management for Claude
- Secrets via environment variables
- Strict CORS configuration
- Request body size limits

### 8.4 Privacy
- GDPR compliance
- Data retention policy
- Encryption at rest
- Audit logging
- Right-to-deletion handling

---

## 9. Deployment Architecture

### 9.1 Environments
```
Frontend: http://localhost:3000
Backend: http://localhost:5000
Database: localhost:5432
Redis: localhost:6379
```

### 9.2 Production Topology
```
┌─────────────────┐
│   CloudFlare    │
└────────┬────────┘
         │
┌────────▼────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
┌───▼──┐  ┌──▼───┐
│ Web  │  │ Web  │
└───┬──┘  └──┬───┘
    │         │
    └────┬────┘
         │
┌────────▼────────┐
│   API Gateway   │
└────────┬────────┘
         │
    ┌────┴────┐
┌───▼──┐  ┌──▼───┐
│ API  │  │ API  │
└───┬──┘  └──┬───┘
    │         │
    └────┬────┘
         │
    ┌────▼─────────┐
┌───▼───┐    ┌────▼────┐
│ DB    │    │  Cache  │
│Primary│    │ (Redis) │
└───┬───┘    └─────────┘
    │
┌───▼───┐
│ DB    │
│Replica│
└───────┘
```

### 9.3 Dockerfiles
```dockerfile
# Frontend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

# Backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### 9.4 Docker Compose
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://backend:5000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/complaints
      - REDIS_URL=redis://redis:6379
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=complaints
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 10. Testing Strategy

### 10.1 Unit
```javascript
describe('Complaint Classification', () => {
  test('classifies HR complaint', async () => {
    const complaint = "My manager is harassing me";
    const result = await classifyComplaint(complaint);
    expect(result.category).toBe('HR');
    expect(result.priority).toBe('urgent');
  });

  test('marks ambiguous complaints unclassified', async () => {
    const complaint = "xyz abc";
    const result = await classifyComplaint(complaint);
    expect(result.category).toBe('Unclassified');
  });
});
```

### 10.2 Integration
```javascript
describe('Complaint Submission', () => {
  test('creates complaint and sends email', async () => {
    const response = await request(app)
      .post('/api/complaints')
      .send({
        empId: 'EMP001',
        email: 'test@example.com',
        phone: '+60123456789',
        complaint: 'Test complaint'
      });

    expect(response.status).toBe(201);
    expect(response.body.category).toBeDefined();
    // Confirm email dispatch
  });
});
```

### 10.3 E2E
```javascript
describe('User Complaint Submission', () => {
  it('allows complaint submission', () => {
    cy.visit('/');
    cy.contains('Make a Complaint').click();
    cy.get('input[name="empId"]').type('EMP001');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="phone"]').type('+60123456789');
    cy.get('textarea[name="complaint"]').type('Test complaint');
    cy.contains('Submit Complaint').click();
    cy.contains('Complaint submitted successfully').should('be.visible');
  });
});
```

---

## 11. Performance Optimization

### 11.1 Frontend
- Code splitting with `React.lazy`
- Lazy loading images/assets
- Memoization via `useMemo`/`useCallback`
- Virtual scrolling on long lists
- Bundle size trimming

### 11.2 Backend
- Index frequently queried columns
- Optimize queries to avoid N+1
- Cache responses via Redis
- Connection pooling
- Rate limiting

### 11.3 Caching Strategy
```
┌──────────────────────────────────────┐
│         Cache Layers                 │
├──────────────────────────────────────┤
│ Browser Cache (Static Assets)       │
│ CDN Cache (Images, CSS, JS)         │
│ Redis Cache (API Responses)         │
│ Database Query Cache                │
└──────────────────────────────────────┘

Cache Keys:
- complaints:all:{page}:{filter} → 5 minutes
- analytics:dashboard → 10 minutes
- ai:summary:{period} → 1 hour
- complaint:{id} → 30 minutes
```

---

## 12. Monitoring & Logging

### 12.1 Monitoring
```
Tools: New Relic / Datadog / Prometheus + Grafana
Metrics: request rate, latency, error rate, API response times, Claude usage/costs, DB performance, memory/CPU
```

### 12.2 Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

logger.info('Complaint created', {
  complaintId: 123,
  category: 'HR',
  userId: 'EMP001'
});
```

### 12.3 Alerting
- Critical: API error rate > 5%, DB connection failures, Claude rate limit exceeded, disk space < 10%
- Warning: Response time > 2s, Unclassified complaints > 20%, Email delivery failures

---

## 13. Implementation Roadmap

### Phase 1 – Foundation (Weeks 1-2)
```
Env setup, DB schema, base API, auth, frontend scaffold
```

### Phase 2 – Core Features (Weeks 3-4)
```
Complaint form, file uploads, admin dashboard basics, CRUD, email notifications
```

### Phase 3 – AI Integration (Weeks 5-6)
```
Claude integration, classification, unclassified handling, summaries, priority detection
```

### Phase 4 – Advanced Features (Weeks 7-8)
```
Analytics UI, charts, advanced filtering, bulk ops, export tools
```

### Phase 5 – Testing & Polish (Weeks 9-10)
```
Unit/integration/E2E tests, performance tuning, security audit, UX refinement
```

### Phase 6 – Deployment (Weeks 11-12)
```
Prod setup, CI/CD, monitoring/logging, documentation, training, go-live
```

---

## 14. Cost Estimation

### 14.1 Infrastructure (Monthly)
```
Web servers (2): $100
Database: $50
Redis: $20
S3 storage: $30
Load balancer: $20
Total ≈ $220/month
```

### 14.2 Third-Party Services
```
Anthropic Claude: $50–$200/month
Email service (SendGrid): $15–$100/month
Total ≈ $65–$300/month
```

### 14.3 Development Effort
```
Frontend: 200h, Backend: 250h, DevOps: 50h, QA: 100h
Total ≈ 600h (~12 weeks)
```

---

## 15. Maintenance & Support

### 15.1 Routine Tasks
```
Daily: monitor health, review logs, inspect unclassified complaints
Weekly: verify backups, review performance, apply security patches
Monthly: usage reports, AI accuracy review, docs refresh
```

### 15.2 Support Levels
```
L1 Help Desk – user issues, FAQ
L2 Technical – bug investigation, config changes, data recovery
L3 Engineering – code fixes, feature work, architecture updates
```

---

## 16. Future Enhancements

### 16.1 Short-Term (3-6 months)
- Mobile app (React Native)
- SMS notifications
- Multi-language UI
- Advanced search and filtering
- Complaint escalation workflows
- SLA tracking

### 16.2 Long-Term (6-12 months)
- AI chatbot triage
- Sentiment analysis
- Predictive analytics
- HRIS integrations (Workday, SAP)
- Voice-to-text submissions
- Anonymous complaint mode
- Real-time dashboards (WebSockets)

---

## 17. Compliance & Standards

### 17.1 Data Protection
- GDPR alignment
- Encryption at rest/in transit
- Regular security audits
- Data retention policies
- Right-to-access/deletion workflows

### 17.2 Industry Standards
- ISO 27001, SOC 2
- OWASP Top 10 alignment
- Accessibility (WCAG 2.1 AA)

---

## 18. Documentation Requirements

### 18.1 Technical
- API docs (OpenAPI/Swagger)
- Database schema references
- System architecture diagrams
- Deployment guide
- Troubleshooting handbook

### 18.2 User-Facing
- User manual
- Admin guide
- FAQ
- Video tutorials
- Quick start guide

---

## Appendix A: Environment Variables
```bash
NODE_ENV=production
PORT=5000
APP_URL=https://complaints.company.com
DATABASE_URL=postgresql://user:pass@host:5432/complaints
DB_POOL_SIZE=20
REDIS_URL=redis://host:6379
REDIS_PASSWORD=your_redis_password
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_EXPIRES_IN=7d
ANTHROPIC_API_KEY=sk-ant-xxx
ANTHROPIC_MODEL=claude-sonnet-4-20250514
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
EMAIL_FROM=noreply@company.com
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,video/mp4
UPLOAD_DIR=./uploads
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=complaints-attachments
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://frontend.company.com
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn
```

---

## Appendix B: Sample API Responses

### Success
```json
{
  "success": true,
  "data": {
    "id": 123,
    "empId": "EMP001",
    "category": "HR",
    "status": "Pending",
    "createdAt": "2025-10-27T10:30:00Z"
  },
  "message": "Complaint created successfully"
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "field": "email"
  }
}
```

---

## Conclusion
Modular architecture, AI-enriched workflows, and robust security practices enable a scalable complaint management platform. Success hinges on phased delivery, strong monitoring, and thorough documentation to support continuous improvement.
