# @scrub-shop/shared-sdk
Shared, framework-agnostic access to the Scrub Shop backend (Supabase).  
**Design goals:** single source of truth, no UI/DOM assumptions, works in Vite (web) and Expo (mobile).

## Env variables
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

In Vite, also supported:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

In Expo, also supported via extra config:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

The SDK does not polyfill browser-only APIs and makes no routing/UI assumptions.
