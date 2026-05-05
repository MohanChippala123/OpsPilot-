# OpsPilot Public Launch Checklist

Use this before posting publicly or sending the app to accelerators.

## Vercel Deployment

- Import `MohanChippala123/OpsPilot-` from GitHub.
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`
- Framework Preset: Other
- Redeploy after every push to `main`.

If Vercel only lets you choose a folder, choose `frontend`, set Build Command to `npm run build`, and Output Directory to `dist`.

## Smoke Test

- Open the deployed URL in Chrome or Edge.
- Click `Preview the app`.
- Click each dashboard metric card and confirm it opens the right page.
- Click `New workflow`, add an incoming message, and approve the AI reply.
- Click a calendar slot and confirm a new appointment appears.
- Move a job between columns.
- Update settings and confirm `Saved` appears.
- Click `Install app` and confirm the PWA install prompt or browser install instructions appear.

## Public Demo Positioning

Current public build: installable PWA with local browser storage.

Say this clearly:

> OpsPilot is in early public preview. Your workspace data is stored on your device while we validate the product with service businesses.

Do not market it yet as shared team software, HIPAA-ready, SOC 2-ready, or production customer-data infrastructure. The next serious production step is a cloud database, authentication hardening, password reset, email verification, and billing.

## Before YC or Investor Review

- Record a 60-90 second demo video.
- Add the deployed Vercel URL to the application.
- Add a founder email for user feedback.
- Collect at least 5 conversations with local service operators.
- Track signups, demos, and repeated usage manually in a simple spreadsheet.
- Prepare one clear answer to: "What did users do before OpsPilot?"

