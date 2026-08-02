# Hanchi (mobile)

Expo app for **Hanchi** — cultural discovery of neighborhoods, communities, and local food.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Copy env and set API + Supabase Auth keys

   ```bash
   cp .env.example .env
   ```

   Required in `.env`:
   - `EXPO_PUBLIC_API_URL` — Railway API base URL
   - `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` — anon/publishable key

   Sign-up is required so users can set cultural background during onboarding. The API must also have `SUPABASE_URL` + `SUPABASE_SECRET_KEY` set.

   **Email confirmation deep links:** In Supabase → Authentication → URL Configuration:
   - **Site URL:** any https URL is fine as a default (e.g. your project URL). Do **not** leave `http://localhost:3000` if you care about confirm redirects.
   - **Redirect URLs:** add `hanchi://auth/callback` (exact). The app passes this as `emailRedirectTo`.

   **Why confirm emails stop arriving (built-in Supabase SMTP):**
   - Only emails belonging to members of your Supabase org/team are allowed — other addresses fail with “Email address not authorized.”
   - Rate limit is about **2 messages/hour** without custom SMTP.
   - Fastest local workaround: Authentication → Providers → Email → turn **Confirm email** off, or sign up with your team email.
   - For real delivery: Authentication → SMTP → custom provider (Resend, etc.).

3. Start the app

   ```bash
   npx expo start
   ```

See `docs/Hanchi_Brand_Foundation.md` for brand principles.
