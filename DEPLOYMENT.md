# Production Deployment Runbook

OpsPilot deploys as one Node web service. Express serves the compiled React app and all API routes.

## Recommended Host

Use Render, Railway, Fly.io, or any Docker host that supports:

- Node 24
- A persistent disk or volume mounted at `backend/data`
- HTTPS
- Environment variables

## Render Blueprint

1. Push `main` to GitHub.
2. In Render, create a new Blueprint from this repo.
3. Let Render detect `render.yaml`.
4. Add `OPENAI_API_KEY` or switch `AI_PROVIDER=anthropic` and add `ANTHROPIC_API_KEY`.
5. Set `CORS_ORIGINS` to the final Render URL or your custom domain.
6. Apply the Blueprint.
7. After deploy, open `/health`, then create a real account from the signup screen.

The included `render.yaml` uses a persistent disk because this app is no longer browser-local demo software.

## Required Variables

- `NODE_ENV=production`
- `PORT=4000`
- `DATABASE_URL=./backend/data/ops-assistant.db`
- `JWT_SECRET`
- `JWT_EXPIRES_IN=7d`
- `CORS_ORIGINS=https://your-domain.com`
- `AI_PROVIDER=openai`
- `OPENAI_API_KEY=...`

## Verification

Run these checks before inviting users:

- `npm run build` passes.
- `/health` returns `{ "ok": true }`.
- `/ready` returns `{ "ok": true, "database": "connected" }`.
- Signup creates a new workspace.
- Login works after browser refresh.
- Messages create AI suggestions.
- Tasks and appointments persist after service restart.
- The browser install prompt appears from the production URL.

## Important Note

The production app must have persistent storage. A free static-only Vercel deployment is useful for previews, but it is not the actual shared OpsPilot product.
