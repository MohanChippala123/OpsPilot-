# Deployment Runbook

OpsPilot can run as one Node web service in production. The backend serves the compiled React app from `frontend/dist` and exposes API routes under `/api`.

## Required Environment Variables

Use `.env.production.example` as the checklist.

- `NODE_ENV=production`
- `PORT=4000`
- `DATABASE_URL=./backend/data/ops-assistant.db` for the included SQLite MVP
- `JWT_SECRET` with at least 32 random characters
- `CORS_ORIGINS=https://your-production-domain.com`
- `AI_PROVIDER=openai` or `anthropic` for public users
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

## Render

1. Push this repo to GitHub.
2. Create a Render Blueprint from `render.yaml`.
3. Set `CORS_ORIGINS` to the Render service URL or your custom domain.
4. Replace `AI_PROVIDER=mock` with a real provider before inviting customers.
5. Add the matching API key as a secret environment variable.
6. Deploy.

## Docker

```bash
docker build -t opspilot .
docker run --env-file .env.production.example -p 4000:4000 -v opspilot-data:/app/backend/data opspilot
```

## Production Checklist

- Build passes with `npm run build`.
- `/health` and `/ready` return `{ "ok": true }`.
- Signup, login, dashboard, messages, tasks, calendar, and settings work.
- A persistent disk or volume is mounted for `backend/data`.
- A real AI provider is configured.
- Demo seed data is not run in production.
- `JWT_SECRET` is rotated before launch.

## Notes

SQLite is acceptable for a low-traffic MVP and customer validation. Move to PostgreSQL before heavy concurrent usage, multi-region deployment, advanced reporting, or strict backup/restore requirements.
