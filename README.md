# Netblag Personal Web

Personal site for Ashkan with:

- Editorial portfolio design
- English / Persian switch
- Light / dark theme
- Tools workspace
- Anonymous message form
- Private admin area via Supabase Auth + RLS
- Backend-ready chat UI

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Fill `.env` with the Supabase URL and public anon key.

## Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in SQL Editor.
3. Create your single admin user in Authentication.
4. Put only the public project URL + anon key in `.env`.
5. Never put service-role keys in Vite/frontend code.

## GitHub Pages

Build output is in `dist/`. For a clean GitHub Pages deployment from a separate public build repository, publish `dist` through GitHub Actions or your deployment pipeline.

## Chat

The frontend calls `VITE_PUBLIC_CHAT_ENDPOINT` and expects JSON such as:

```json
{ "text": "response from your server" }
```

The LLM/API key must live on the backend, not in the browser bundle.

## Routes

Because this targets GitHub Pages static hosting, routing uses a hash router. The public URLs are:

- `/#/` home
- `/#/tools` tools
- `/#/chat` chat
- `/#/admin` private admin login
- `/#/admin/dashboard` admin dashboard
