# OpsPilot | AI Operations Assistant

OpsPilot is a full-stack AI operations assistant for small service businesses. It handles customer messages, AI reply suggestions, scheduling, reminders, jobs, and business-level AI behavior settings.

The app is deployable as a single Node service: Express serves the API under `/api` and serves the compiled React dashboard from `frontend/dist`.

## Local Development

```bash
npm install
cp backend/.env.example backend/.env
npm run seed
npm run dev
```

Open `http://localhost:5173`.

Demo login:

- Email: `owner@brightlinehvac.com`
- Password: `password123`

## Production Build

```bash
npm install
npm run build
npm start
```

Required production variables are listed in `.env.production.example`.

## Deployment

Use one of the included deployment paths:

- `render.yaml` for a Render Blueprint deployment.
- `Dockerfile` for container hosting.
- `DEPLOYMENT.md` for the public launch runbook.
- `SECURITY.md` for baseline security controls and next hardening steps.

## Important Public Launch Note

The included SQLite database is fine for MVP validation. Before real scale or regulated customer data, move to PostgreSQL, add email verification/password reset, configure backups, and use a real LLM provider instead of `AI_PROVIDER=mock`.
