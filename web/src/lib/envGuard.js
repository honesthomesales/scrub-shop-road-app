// src/lib/envGuard.js

// Vite exposes env via import.meta.env in the browser.
// We export it as "ENV" so callers can do: import { ENV } from '../lib/envGuard'
export const ENV = import.meta.env ?? {};

// Treat "1" or "true" (case-insensitive) as boolean true
export const asBool = (v) =>
  typeof v === 'string' && ['1', 'true'].includes(v.toLowerCase());

// Required VITE_* vars for runtime
const REQUIRED = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

// Returns a simple shape the UI can render
export function assertEnv() {
  const missing = REQUIRED.filter(
    (k) => !ENV[k] || String(ENV[k]).trim() === ''
  );

  return {
    missing,
    flags: {
      useSharedSDK: asBool(ENV.VITE_USE_SHARED_SDK || ''),
    },
    env: {
      VITE_SUPABASE_URL: ENV.VITE_SUPABASE_URL,
      VITE_USE_SHARED_SDK: ENV.VITE_USE_SHARED_SDK,
    },
  };
}

// Optional default export for older imports, harmless to keep
export default { ENV, assertEnv, asBool };
