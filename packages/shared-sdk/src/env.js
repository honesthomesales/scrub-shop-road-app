// Minimal, framework-agnostic env resolution for Web (Vite) and Expo.
// Safely access Vite's import.meta.env and Node's process.env (when present).

function readViteEnv(key) {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
      return import.meta.env[key];
    }
  } catch (_) {}
  return undefined;
}

function getProcEnv() {
  try {
    // Avoid ReferenceError in browsers where `process` is undefined
    return typeof process !== 'undefined' && process && process.env ? process.env : undefined;
  } catch (_) {
    return undefined;
  }
}

export function getEnv() {
  const procEnv = getProcEnv();

  const supabaseUrl =
    (procEnv && procEnv.SUPABASE_URL) ??
    readViteEnv('VITE_SUPABASE_URL') ??
    (procEnv && procEnv.VITE_SUPABASE_URL) ??
    (procEnv && procEnv.EXPO_PUBLIC_SUPABASE_URL) ??
    '';

  const supabaseAnonKey =
    (procEnv && procEnv.SUPABASE_ANON_KEY) ??
    readViteEnv('VITE_SUPABASE_ANON_KEY') ??
    (procEnv && procEnv.VITE_SUPABASE_ANON_KEY) ??
    (procEnv && procEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY) ??
    '';

  return { supabaseUrl, supabaseAnonKey };
}

export function assertEnv() {
  const { supabaseUrl, supabaseAnonKey } = getEnv();
  const missing = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL (or VITE_/EXPO_PUBLIC_ variants)');
  if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY (or VITE_/EXPO_PUBLIC_ variants)');
  if (missing.length) {
    console.warn(`[shared-sdk] Missing env: ${missing.join(', ')}`);
  }
}
