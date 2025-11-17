# Render Deployment Guide

This guide walks through hosting the Jabil Feedback System (FastAPI backend + Vite/React frontend) on [Render](https://render.com). It covers the required services, environment variables, persistent storage, and verification steps.

> **Tip:** Render can deploy everything defined in a `render.yaml`, but you can also follow the same settings manually in the dashboard. Both options are described below.

---

## 1. Prerequisites

- Render account with permission to create Web Services and Static Sites.
- Fork of this repository connected to Render, or a GitHub/Bitbucket repo Render can access.
- Production secrets (JWT secret, Groq key, SMTP creds, etc.).
- Optional: Render CLI for copying existing `data/db.json` or `uploads/` into the persistent disk after the first deploy.

---

## 2. Required Environment Variables

### Backend service (`app/main.py`)

| Key | Purpose | Notes |
| --- | --- | --- |
| `NODE_ENV` | Marks prod/staging | Use `production` for live. |
| `JWT_SECRET` | Token signing secret | Generate a long random value. |
| `GROQ_API_KEY` | Enables AI classification | Optional if AI is disabled. |
| `EMAIL_FROM`, `SMTP_*` | Reply/notification emails | Configure if SMTP is required. |
| `CORS_ALLOW_ORIGINS` | Comma-separated origins | Include the Render frontend URL. |
| `DATA_STORE_PATH` | JSON datastore location | Point to the mounted disk, e.g. `/var/persist/db.json`. |
| `UPLOAD_DIR` | Attachment storage | e.g. `/var/persist/uploads`. |
| `REPORT_*`, `LOG_FORMAT`, etc. | Optional overrides | Defaults work if unset. |

### Frontend service (`frontend/`)

| Key | Purpose |
| --- | --- |
| `VITE_API_URL` | Absolute URL of the backend service (`https://<backend>.onrender.com`). |

Render injects `PORT` automatically for web services; no extra configuration is needed.

---

## 3. `render.yaml` Example (optional but recommended)

Create `render.yaml` in the repo root and push it so Render can autodiscover both services:

```yaml
services:
  - type: web
    name: jabil-feedback-api
    env: python
    plan: starter
    buildCommand: pip install --upgrade pip && pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    autoDeploy: true
    healthCheckPath: /health
    disk:
      name: feedback-persist
      mountPath: /var/persist
      sizeGB: 1
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATA_STORE_PATH
        value: /var/persist/db.json
      - key: UPLOAD_DIR
        value: /var/persist/uploads
      - key: CORS_ALLOW_ORIGINS
        value: https://jabil-feedback-frontend.onrender.com
      # Add JWT_SECRET, GROQ_API_KEY, SMTP_* either inline (not recommended) or via dashboard env var group

  - type: web
    name: jabil-feedback-frontend
    env: static
    rootDir: frontend
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    pullRequestPreviewsEnabled: false
    envVars:
      - key: VITE_API_URL
        fromService:
          type: web
          name: jabil-feedback-api
          property: url
```

Replace service names, plan sizes, and domains with your own. You can also convert the sensitive env vars to [Render Env Groups](https://render.com/docs/env-groups) and reference them via `fromGroup`.

---

## 4. Backend Web Service Steps

1. **Create Web Service → Build & Deploy from Repo.**
2. Choose the branch to deploy and select **Python** for the runtime.
3. **Build command:** `pip install --upgrade pip && pip install -r requirements.txt`.
4. **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Enable **Auto-Deploy** so pushes redeploy automatically.
6. Add a **Persistent Disk** (≥1 GB) mounted at `/var/persist`. This disk stores `data/db.json` and `uploads/`.
   ```text
   DATA_STORE_PATH=/var/persist/db.json
   UPLOAD_DIR=/var/persist/uploads
   ```
   Create the two folders once via shell (`mkdir -p /var/persist/uploads`) or an init script.
7. Configure environment variables from the table above. Make sure `CORS_ALLOW_ORIGINS` includes both the production frontend URL and any admin domain you use for manual testing (comma-separated).
8. If you plan to keep AI disabled, leave `GROQ_API_KEY` unset and the AI routes will fall back gracefully.
9. Click **Create Web Service**. Watch the logs to confirm `Application startup complete` and hit `https://<backend>/health` to verify a `{"status": "ok"}` response.

---

## 5. Frontend Static Site Steps

1. **Create Static Site → Build from Repo.**
2. Set **Root Directory** to `frontend`.
3. **Build command:** `npm install && npm run build`.
4. **Publish directory:** `dist`.
5. Set `VITE_API_URL` to the full backend origin (for example, `https://jabil-feedback-api.onrender.com`).
6. Deploy. Once live, open the Render-provided URL and confirm login works against the backend.

> **Note:** If you plan to attach a custom domain, add it after the first successful deploy and update `CORS_ALLOW_ORIGINS` to include the new host.

---

## 6. Post-Deploy Checklist

1. Visit the backend `/docs` to confirm the Swagger UI loads over HTTPS.
2. Log in via the frontend using the seeded `admin/admin123` credentials and create a sample complaint.
3. Upload a file to ensure the persistent disk path is writable.
4. Verify SSE notifications: open the app in two browser tabs, add a reply in one, and confirm the other tab receives it without a full refresh.
5. If Groq AI is configured, hit `/api/complaints/{id}/assist` and inspect `logs/groq_last_response.json` (download via `render ssh`) for troubleshooting.
6. Schedule backups of `/var/persist/db.json` if you rely on the JSON datastore in production.

---

## 7. Troubleshooting Tips

- **`ModuleNotFoundError` during build** – ensure the root path contains `requirements.txt` and the service is created at the repository root (not `frontend/`).
- **CORS errors** – confirm `CORS_ALLOW_ORIGINS` exactly matches the scheme + host of the frontend and any localhost origins you use.
- **Uploads vanish after restart** – verify the persistent disk is attached and the `UPLOAD_DIR` is pointing inside it.
- **Slow cold starts** – Render free plans spin down; upgrade to Starter or above for always-on behavior if background schedulers are critical.
- **Background jobs missing** – the APScheduler runs inside the web service; make sure only one instance of the backend is scaled horizontally or the jobs will fire multiple times.

With the services deployed, commit any supporting infrastructure files (`render.yaml`, documentation updates) so future teammates can redeploy consistently.

