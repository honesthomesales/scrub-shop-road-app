// Dynamic import to avoid build-time dependencies
let _client = null
let _createClient = null

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
      // Dynamic import to avoid build-time dependencies
      const { createClient } = await import('@supabase/supabase-js')
      _createClient = createClient
      
      _client = createClient(cleanUrl, cleanKey, { 
        auth: { 
          persistSession: false,
          storageKey: 'scrub-shop-shared-sdk' // Use unique storage key to avoid conflicts
        } 
      })
    } catch (error) {
      console.error('[shared-sdk] Failed to import @supabase/supabase-js:', error)
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
