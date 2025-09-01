// web/src/services/sharedSDKAdapter.js
// Safe adapter that *optionally* delegates reads to the shared SDK.
// Default: returns null so existing web services continue to be used.

import { initSupabase, getSupabase } from '@scrub-shop/shared-sdk'

const rawFlag = String(import.meta.env.VITE_USE_SHARED_SDK || '').toLowerCase().trim()
const useShared = rawFlag === '1' || rawFlag === 'true'

export function getSDK() {
  if (!useShared) return null
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim()
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
  
  // Initialize the shared SDK
  try {
    const supabase = initSupabase({ url, anonKey })
    return { supabase, url, anonKey }
  } catch (error) {
    console.error('Failed to initialize shared SDK:', error)
    return null
  }
}
