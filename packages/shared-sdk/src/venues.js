import { getSupabase } from './supabaseClient.js'

/**
 * Returns rows from public.venues (id, common_venue_name, address_city), with count.
 * Assumes initSupabase() was already called by the app.
 */
export async function listVenues() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('venues')
    .select('id,common_venue_name,address_city', { count: 'exact', head: false })
    .limit(1000)

  if (error) return { rows: null, error }
  return { rows: data ?? [], error: null }
}
