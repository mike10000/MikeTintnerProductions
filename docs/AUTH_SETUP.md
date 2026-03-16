# Auth Setup: Google OAuth + Email + Password Reset

Clients can log in with **Google** or **email/password**, and reset their password if needed.

## Password Reset

Built-in. Add these to **Supabase** → **Authentication** → **URL Configuration** → **Redirect URLs**:
- `http://localhost:3001/reset-password`
- `https://yourdomain.com/reset-password`

## Google OAuth (Supabase Dashboard)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **Providers**
2. Enable **Google**
3. Get credentials from [Google Cloud Console](https://console.cloud.google.com/):
   - Create a project (or use existing)
   - **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: add `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Paste **Client ID** and **Client Secret** into Supabase Google provider settings
5. Add your app URLs to **Redirect URLs** in Supabase:
   - `http://localhost:3001/auth/callback`
   - `http://localhost:3001/reset-password`
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/reset-password`

## Email/Password

Already enabled by default in Supabase. No extra setup needed.

## Production (Vercel)

For auth to work in production:

1. **Supabase Dashboard** → Authentication → **URL Configuration**:
   - **Site URL**: Set to your production URL (e.g. `https://yourdomain.com` or `https://your-app.vercel.app`)
   - **Redirect URLs**: Add `https://yourdomain.com/**` and `https://*.vercel.app/**` for Vercel previews

2. **Vercel** → Project Settings → **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required)
   - `NEXT_PUBLIC_APP_URL`: Your production URL (e.g. `https://yourdomain.com`)
