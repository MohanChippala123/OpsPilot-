# OpsPilot

OpsPilot is an installable AI operations workspace for service businesses. It gives teams a shared inbox, AI reply drafting, task creation, appointment tracking, and business-level assistant settings from one production web app.

This repo now deploys as an actual full-stack app:

- Express API under `/api`
- React dashboard served by the backend in production
- Persistent server-side database
- JWT authentication
- PWA install support for desktop and mobile browsers
- OpenAI or Anthropic provider required in production

## Local Development

```bash
npm install
cp backend/.env.example backend/.env
npm run seed
npm run dev
```

Open `http://localhost:5173`.

Local seed login:

- Email: `owner@brightlinehvac.com`
- Password: `password123`

Seed data is refused when `NODE_ENV=production`.

## Production Build

```bash
npm install
npm run build
npm start
```

The production backend serves `frontend/dist` and exposes health checks at `/health` and `/ready`.

## Production Environment

Use `.env.production.example` as the checklist:

- `NODE_ENV=production`
- `PORT=4000`
- `DATABASE_URL=./backend/data/ops-assistant.db`
- `JWT_SECRET` with at least 32 random characters
- `CORS_ORIGINS=https://your-production-domain.com`
- `AI_PROVIDER=openai` or `anthropic`
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

`AI_PROVIDER=mock` is blocked in production.

## Deploy

Use Render Blueprint or Docker for the real full-stack app. The app needs persistent storage for the database.

```bash
docker build -t opspilot .
docker run --env-file .env.production.example -p 4000:4000 -v opspilot-data:/app/backend/data opspilot
```

Vercel can still host the frontend as a static shell, but that is not the recommended production path for this repo because the real app needs the Express API and persistent server-side data.

## Installable App

After deployment, users open the production URL in Chrome or Edge and choose **Install app**. The installed app talks to the production API; data is shared through the backend rather than stored only in the browser.
