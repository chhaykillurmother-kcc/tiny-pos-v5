# Tiny POS v5.0 — Netlify Frontend + Apps Script Backend

This is a fresh-install package for a new Google Sheet and a new Telegram bot.

## Architecture

- **Frontend:** Netlify HTTPS site
- **Camera scanner:** Runs directly inside the Netlify POS page
- **Secure proxy:** Netlify Function at `/api/pos`
- **Backend:** Google Apps Script Web App
- **Database:** New Google Sheet
- **Mini App:** New Telegram bot opens the Netlify URL

## Start here

Read [`docs/START_HERE_STEP_BY_STEP.md`](docs/START_HERE_STEP_BY_STEP.md).

## Main files

- `apps-script/TinyPOS_Backend_V50.gs` — one paste-ready Apps Script file
- `apps-script/appsscript.json` — Apps Script manifest
- `netlify-site/public/index.html` — complete POS frontend
- `netlify-site/netlify/functions/pos-api.mjs` — secure API proxy
- `netlify.toml` — Netlify configuration

## Safety

Install on a new blank Google Sheet. Keep the existing working POS unchanged until v5.0 passes the full test plan.
