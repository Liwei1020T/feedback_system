<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# AI Agent Guidelines for Jabil Feedback System

> **Purpose**: This document guides AI coding assistants working on the feedback-v3 Jabil Feedback System. Follow these guidelines to maintain code quality, consistency, and system integrity.

---

## 🎯 System Overview
- Sends email notifications when admins respond
- Generates analytics, reports, and trend insights
- **Backend**: FastAPI (Python 3.11+), in-memory datastore (JSON file), Groq AI integration
- **Frontend**: React 18 + TypeScript + Vite, Zustand state management, Tailwind CSS
- **Key Dependencies**: uvicorn, pydantic, python-multipart (backend); react-router, recharts (frontend)

---

## 📂 Project Structure & Module Organization

### Backend (`app/`)
```
app/
├── main.py              # FastAPI app entry, CORS, startup/shutdown
├── config.py            # Environment variables, settings (JWT, SMTP, upload limits)
├── datastore.py         # In-memory data persistence (JSON file operations)
├── models.py            # Pydantic domain models (User, Complaint, Reply, etc.)
├── schemas.py           # Request/response DTOs for API endpoints
├── security.py          # JWT token creation/verification, password hashing
├── dependencies.py      # FastAPI dependency injection (auth, permissions)
├── routers/             # API route handlers (thin layer)
│   ├── auth.py          # Login, logout, refresh, verify endpoints
│   ├── complaints.py    # CRUD, filtering, AI assist endpoint
│   ├── replies.py       # Admin replies with email notifications
│   └── logs.py          # Activity logs
└── services/            # Business logic layer
    ├── ai.py            # Groq integration (classify, summarize, assist)
    ├── analytics.py     # Metrics calculation, trend analysis
    ├── assignment.py    # Auto-assign complaints to admins
    ├── auth.py          # Authentication logic
    └── email.py         # SMTP email sending
```

**Key Principles:**
- Routers handle **request/response only**—delegate business logic to `services/`
- All data operations go through `datastore.py` (single source of truth)
- Models in `models.py` are domain entities; `schemas.py` are API contracts
- Security logic (JWT, hashing) stays in `security.py` and `dependencies.py`

### Frontend (`frontend/src/`)
```
src/
├── main.tsx             # React app entry, router setup
├── App.tsx              # Root component with routing
├── index.css            # Global styles, Tailwind imports
├── api/                 # Backend API client layer
│   ├── client.ts        # Axios instance with interceptors
│   └── index.ts         # API method exports (login, getComplaints, etc.)
├── components/          # Reusable UI components
│   ├── Layout.tsx       # Main layout with Sidebar + TopBar
│   ├── Sidebar.tsx      # Navigation sidebar
│   ├── TopBar.tsx       # Header with user info
│   ├── ComplaintTable.tsx
│   ├── ComplaintDetails.tsx
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   └── notifications.ts # Toast notification store
├── hooks/               # Custom React hooks
└── types/               # TypeScript type definitions
    └── index.ts         # Shared types (Complaint, User, Reply, etc.)
```

**Key Principles:**
- Components use **PascalCase**, hooks use `useX.ts`, stores use `<Domain>Store.ts`
- API calls go through `src/api/` (never inline fetch/axios in components)
- Shared types in `src/types/` must match backend Pydantic models
- Pages are route-level components; extract reusable logic into `components/`
- Use Zustand for global state (notifications, etc.), React context for auth

### Supporting Directories
- `docs/` — reference material (complaint-system-framework.md is the spec)
- `uploads/` — local file storage for complaint attachments
- `logs/` — runtime logs (`app.log`, `groq_last_response.json`)
- `data/` — in-memory datastore persistence (`db.json`)

---

## 🚀 Build, Test, and Development Commands

### Backend Setup (PowerShell on Windows)
```powershell
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload

# Health check
# Visit http://localhost:8000/health
```

**Default Credentials**: `admin` / `admin123` (seeded on startup)

### Frontend Setup
```powershell
cd frontend

# Install packages (requires Node 18+)
npm install

# Run dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

### Environment Variables
Create `.env` files (copy from `.env.example`):
- **Backend root**: `GROQ_API_KEY`, `JWT_SECRET`, SMTP credentials
- **Frontend root**: `VITE_API_URL` (defaults to `http://localhost:8000`)

**Never commit `.env` files!**

---

## 🎨 Coding Style & Naming Conventions

### Python (Backend)
- Follow **PEP 8**: 4-space indentation, snake_case functions/variables, PascalCase classes
- **Type hints required**: Use `from typing import Optional, List, Dict` and annotate all functions
- **Async/await**: All route handlers and service methods should be `async def` where possible
- **Error handling**: Raise `HTTPException` with appropriate status codes; don't return error dicts
- **Logging**: Use `logger = logging.getLogger(__name__)` and log at appropriate levels

**Example:**
```python
from fastapi import HTTPException, status
from typing import List, Optional

async def get_complaints(
    status_filter: Optional[str] = None,
    category: Optional[str] = None
) -> List[Complaint]:
    """Retrieve complaints with optional filters."""
    try:
        complaints = await datastore.get_all_complaints()
        if status_filter:
            complaints = [c for c in complaints if c.status == status_filter]
        return complaints
    except Exception as e:
        logger.error(f"Failed to fetch complaints: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve complaints"
        )
```

### TypeScript/React (Frontend)
- **TypeScript strict mode**: No `any` types (use `unknown` if truly needed)
- **Component naming**: PascalCase (e.g., `ComplaintTable.tsx`)
- **Hooks**: `useX.ts` (e.g., `useAuth.ts`, `useComplaints.ts`)
- **Props interface**: Define inline or as separate type in `types/index.ts`
- **Async handling**: Use `async/await`, avoid `.then()` chains
- **State management**: Zustand for global state, `useState` for local component state

**Example:**
```typescript
import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Complaint } from '../types';

interface ComplaintTableProps {
  statusFilter?: string;
  onSelect: (complaint: Complaint) => void;
}

export const ComplaintTable: React.FC<ComplaintTableProps> = ({ 
  statusFilter, 
  onSelect 
}) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const data = await api.getComplaints({ status: statusFilter });
        setComplaints(data);
      } catch (error) {
        console.error('Failed to load complaints:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, [statusFilter]);

  // ... render logic
};
```

### Design System
- **Tailwind CSS**: Use utility classes (avoid custom CSS unless necessary)
- **Colors**: Blue gradient theme (blue-50 to blue-900), slate for neutrals
- **Animations**: Defined in `tailwind.config.ts` (fadeIn, slideInFromLeft, scaleIn)
- **Spacing**: Consistent padding/margins (p-4, p-6, p-8 for cards/panels)
- **Shadows**: `shadow-lg`, `shadow-xl` for depth

See `DESIGN_IMPROVEMENTS.md` for full design specifications.

---

## 🧪 Testing Guidelines

### Current State
- **No automated tests yet** — this is a priority area for improvement
- Manual testing via Swagger UI (`/docs`) and frontend dev server

### Planned Testing Strategy

#### Backend Tests (To Implement)
```
tests/
├── test_auth.py         # Login, logout, token refresh
├── test_complaints.py   # CRUD, AI assist, filtering
├── test_replies.py      # Admin replies, email sending
├── test_files.py        # Upload validation, download, delete
└── test_analytics.py    # Metrics calculation
```

**Use `pytest` + `fastapi.testclient`:**
```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_login_success():
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
```

#### Frontend Tests (To Implement)
```
src/components/ComplaintTable.test.tsx
src/pages/LoginPage.test.tsx
```

**Use `vitest` + React Testing Library:**
```typescript
import { render, screen } from '@testing-library/react';
import { ComplaintTable } from './ComplaintTable';

test('renders complaint table', () => {
  render(<ComplaintTable complaints={[]} />);
  expect(screen.getByText('No complaints')).toBeInTheDocument();
});
```

### Manual Testing Checklist
Before committing changes, verify:
1. ✅ Backend health check: `http://localhost:8000/health`
2. ✅ Login flow: POST `/api/auth/login` with `admin/admin123`
3. ✅ Submit complaint: POST `/api/complaints` with test data
4. ✅ AI classification: Check `category`, `priority` in response
5. ✅ File upload: POST `/api/upload` with valid file
6. ✅ Frontend loads: `npm run dev` and navigate routes
7. ✅ No console errors in browser DevTools
8. ✅ Run `npm run lint` in frontend (should pass)

---

## 🔒 Security & Configuration Tips

### Environment Variables (Critical)
**Never commit these to version control!**

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ | Groq LLM API key (AI features) |
| `JWT_SECRET` | ✅ | Token signing secret (production) |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | ⚠️ | Email delivery (optional in dev) |
| `EMAIL_FROM` | ⚠️ | Sender email address |
| `UPLOAD_DIR` | ❌ | Defaults to `./uploads` |
| `MAX_FILE_SIZE` | ❌ | Defaults to 10MB |
| `ALLOWED_FILE_TYPES` | ❌ | Defaults to `image/jpeg,image/png,video/mp4,application/pdf` |

### File Upload Security
- **Validate MIME types**: Check `allowed_file_types` in `config.py`
- **Size limits**: Enforce `max_file_size` (default 10MB)
- **Sanitize filenames**: Strip special characters, prevent path traversal
- **Scan uploads**: Treat all files as untrusted user input

### Authentication Best Practices
- **JWT tokens**: Short-lived access tokens (30 min), long-lived refresh tokens (7 days)
- **Password hashing**: Use `bcrypt` (already implemented in `security.py`)
- **Token blacklisting**: Logout tokens stored in `revoked_tokens` set (in-memory)
- **CORS**: Configured in `main.py` — review allowed origins for production

### Logging & Privacy
- Logs stored in `logs/app.log` and `logs/groq_last_response.json`
- **Redact sensitive data**: Never log passwords, full tokens, or PII
- **Log levels**: Use `INFO` for normal operations, `ERROR` for failures, `DEBUG` for development

---

## 🛠️ Common Development Tasks

### Adding a New API Endpoint
1. **Define schema** in `app/schemas.py` (request/response DTOs)
2. **Add route handler** in appropriate `app/routers/*.py` file
3. **Implement business logic** in `app/services/*.py`
4. **Update datastore** in `app/datastore.py` if persistence needed
5. **Add frontend API method** in `frontend/src/api/index.ts`
6. **Update TypeScript types** in `frontend/src/types/index.ts`
7. **Test manually** via Swagger UI and frontend

### Adding a New Frontend Page
1. **Create page component** in `frontend/src/pages/<PageName>.tsx`
2. **Add route** in `frontend/src/App.tsx` (use `ProtectedRoute` if auth required)
3. **Add navigation link** in `frontend/src/components/Sidebar.tsx`
4. **Implement API calls** using methods from `src/api/`
5. **Use shared components** from `src/components/` (Card, StatCard, etc.)
6. **Follow design system** (Tailwind classes, animations from config)

### Modifying AI Behavior
- **AI logic**: `app/services/ai.py` (uses Groq LLM)
- **Prompt engineering**: Modify system prompts in `classify_complaint()`, `assist_complaint()`
- **Model selection**: Set `GROQ_MODEL` in `.env` (default: `llama-3.3-70b-versatile`)
- **Fallback handling**: AI returns `fallback: true` if API fails (preserve this pattern)
- **Testing**: Check `logs/groq_last_response.json` for raw API responses

### Adding a New Complaint Field
1. **Backend model**: Add field to `Complaint` class in `app/models.py`
2. **Schema**: Update `ComplaintCreate`, `ComplaintResponse` in `app/schemas.py`
3. **Datastore**: Ensure `datastore.py` saves/loads new field
4. **Frontend type**: Add to `Complaint` interface in `frontend/src/types/index.ts`
5. **UI**: Update form in `SubmitComplaintPage.tsx` and display in `ComplaintDetails.tsx`
6. **AI integration**: If AI should process this field, update prompts in `ai.py`

---

## 📋 Code Review Checklist

Before marking work as complete, verify:

### Backend
- [ ] Type hints on all function parameters and returns
- [ ] Proper error handling with `HTTPException` and status codes
- [ ] Business logic in `services/`, not in `routers/`
- [ ] No hardcoded secrets (use `config.py` environment variables)
- [ ] Logging added for important operations
- [ ] Datastore operations wrapped in try/except
- [ ] API responses match schemas in `schemas.py`

### Frontend
- [ ] No `any` types (use proper TypeScript types)
- [ ] API calls use methods from `src/api/`, not inline fetch
- [ ] Error handling with try/catch and user feedback
- [ ] Loading states shown during async operations
- [ ] Responsive design (test on mobile/tablet/desktop)
- [ ] Accessibility: semantic HTML, aria labels where needed
- [ ] No console.log statements (use proper logging/error boundaries)
- [ ] Tailwind classes used (avoid inline styles)

### General
- [ ] Code follows naming conventions (snake_case Python, camelCase TS)
- [ ] No commented-out code blocks
- [ ] Meaningful variable/function names
- [ ] Comments explain "why", not "what"
- [ ] Manual testing completed (see checklist above)
- [ ] No merge conflicts
- [ ] Changes align with `docs/complaint-system-framework.md` spec

---

## 🚨 Common Pitfalls & Solutions

### Issue: AI Classification Not Working
**Solution**: Check `GROQ_API_KEY` in `.env`, verify API key is valid, check `logs/groq_last_response.json` for errors

### Issue: File Upload Fails
**Solution**: Verify `UPLOAD_DIR` exists, check file size vs `MAX_FILE_SIZE`, ensure MIME type in `ALLOWED_FILE_TYPES`

### Issue: CORS Errors in Frontend
**Solution**: Update `allow_origins` in `app/main.py` to include frontend URL (e.g., `http://localhost:5173`)

### Issue: JWT Token Expired
**Solution**: Implement token refresh flow in `AuthContext.tsx`, call `/api/auth/refresh` before access token expires

### Issue: Frontend Not Updating After Backend Change
**Solution**: Restart frontend dev server, check `src/types/` matches backend schemas, clear browser cache

### Issue: Email Notifications Not Sending
**Solution**: Verify SMTP credentials in `.env`, check `logs/app.log` for SMTP errors, test with a simple email client first

---

## 📖 Reference Documentation

- **System Spec**: `docs/complaint-system-framework.md` (authoritative source of requirements)
- **Design Guide**: `DESIGN_IMPROVEMENTS.md` (UI/UX specifications)
- **API Docs**: `http://localhost:8000/docs` (interactive Swagger UI)
- **README**: `README.md` (setup instructions, tech stack overview)

---

## 🎯 Agent Task Execution Guidelines

When given a task, follow this workflow:

1. **Understand Context**
   - Read relevant files (don't assume, verify)
   - Check existing patterns in codebase
   - Review related documentation

2. **Plan Changes**
   - Identify all files that need modification
   - Consider impact on backend AND frontend
   - Check for breaking changes

3. **Implement**
   - Make changes incrementally
   - Test each change before moving to next
   - Follow coding style guidelines

4. **Verify**
   - Run manual testing checklist
   - Check for errors in logs/console
   - Verify UI changes visually

5. **Document**
   - Update relevant docs if behavior changes
   - Add inline comments for complex logic
   - Update this AGENTS.md if new patterns introduced

---

## ✨ Key Success Factors

1. **Separation of Concerns**: Routers → Services → Datastore (backend); Pages → Components → API (frontend)
2. **Type Safety**: Full type coverage in Python and TypeScript
3. **Error Handling**: Graceful failures with user-friendly messages
4. **Security First**: Validate inputs, sanitize outputs, never trust user data
5. **Consistency**: Follow existing patterns, don't introduce new paradigms without discussion
6. **Testing**: Manual testing is required until automated tests are in place
7. **Documentation**: Code should be self-documenting; comments explain "why", not "what"

---

**Last Updated**: October 30, 2025  
**Maintainer**: Development Team  
**Questions?** Check README.md or docs/ folder for additional context.