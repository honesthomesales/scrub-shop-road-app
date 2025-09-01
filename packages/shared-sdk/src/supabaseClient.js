// Stub implementation to avoid build-time dependencies
let _client = null

function isLikelyJwt(key) {
  // very loose check: must look like three base64url segments
  return typeof key === 'string' && key.split('.').length === 3
}

export async function initSupabase({ url, anonKey }) {
  const cleanUrl = (url || '').trim()
  const cleanKey = (anonKey || '').trim()

  if (!cleanUrl) throw new Error('Supabase URL missing. Set VITE_SUPABASE_URL')
  if (!/^https:\/\/.+\.supabase\.co/i.test(cleanUrl)) {
    throw new Error(`Supabase URL looks wrong: "${cleanUrl}". Expected "https://...supabase.co"`)
  }
  if (!cleanKey) throw new Error('Supabase anon key missing. Set VITE_SUPABASE_ANON_KEY')
  if (!isLikelyJwt(cleanKey)) {
    console.warn('[shared-sdk] anon key does not look like a JWT (three segments). Double-check you used the ANON key, not service or DB URL.')
  }

  if (!_client) {
    try {
      // Check if we're in a browser environment with Supabase available
      if (typeof window !== 'undefined' && window.supabase) {
        _client = window.supabase
      } else {
        // Create a minimal stub client for build compatibility
        _client = {
          auth: { signOut: () => Promise.resolve() },
          from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) }),
          storage: { from: () => ({ upload: () => Promise.resolve({ data: null, error: null }) }) }
        }
        console.warn('[shared-sdk] Using stub Supabase client - full functionality not available')
      }
    } catch (error) {
      console.error('[shared-sdk] Failed to initialize Supabase client:', error)
      throw new Error('Supabase client library not available')
    }
  }
  return _client
}

export function getSupabase() {
  if (!_client) throw new Error('Supabase not initialized — call initSupabase({ url, anonKey }) first')
  return _client
}

// Compatibility alias for old code
export function makeSupabase(opts) { 
  return initSupabase(opts) 
}
