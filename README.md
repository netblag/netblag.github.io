# Ashkan Ahmadi — Portfolio (single-file build)

`public/index.html` is the **whole website**: markup, styles, interaction and the
Supabase-powered contact form in one self-contained file (no build step, no
dependencies). Drop it in the root of a GitHub Pages repository as `index.html`
and it works as-is.

## Deploy to GitHub Pages

1. Copy `public/index.html` → `index.html` in your `netblag.github.io` repository.
2. Copy `public/images/` → `images/` (hero visual + Open Graph cover).
3. Copy `public/robots.txt` and `public/sitemap.xml` to the repository root.
4. Commit and push. `https://netblag.github.io/` serves the site.

The relative asset path (`images/hero-visual.jpg`) means the file works from a
project page sub-path too (e.g. `/my-repo/`).

## Connect the contact form to Supabase

The form writes **only** `{ name, message }` into the existing
`public.messages` table defined in `supabase/schema.sql`
(`id`, `name`, `message`, `read`, `created_at`) — no schema change required.

Open `index.html`, find the `CONFIG` block at the top of the script and paste
your publishable (anon) key:

```js
var CONFIG = {
  supabaseUrl: "https://<your-project-ref>.supabase.co",
  supabaseAnonKey: "<your-anon-key>", // publishable key — safe in the browser
  table: "messages",
  ...
};
```

Row Level Security stays exactly as shipped: `anon` may **INSERT** only, and
reading / updating / deleting remains reserved for authenticated users listed in
`public.admin_users`. The anon key is therefore safe to ship in a public file.
Never put the `service_role` key in this file.

Delivery order used by the form:

1. Supabase REST insert (`POST /rest/v1/messages`) when URL + anon key are set.
2. Same-origin `POST /api/messages` (this Next.js app) when Supabase isn't configured.
3. Local outbox fallback so the UI is still usable offline.

Anti-spam: a hidden honeypot field, client-side validation (1–80 / 1–2000 chars
after trimming) and server-side rate limiting on the API route.

## Local / preview app (Next.js + PostgreSQL)

The Next.js layer exists only to host the file and provide the fallback API:

- `GET /` → `public/index.html`
- `POST /api/messages` → validates + inserts into the local `messages` table
  (mirrors the Supabase schema, see `src/db/schema.ts`)
- `GET /api/health` → database healthcheck

```bash
npx drizzle-kit push   # create the messages table
npm run build && npm start
```
