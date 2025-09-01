import { getSupabase } from './supabaseClient.js'

export async function probeConnectivity(urlBase, anonKey) {
  const url = (urlBase || '').trim()
  const key = (anonKey || '').trim()
  const results = { steps: [] }

  // Step A: auth health (no auth required)
  try {
    const r = await fetch(`${url}/auth/v1/health`, { 
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    })
    results.steps.push({ step: 'auth-health', ok: r.ok, status: r.status })
    if (!r.ok) throw new Error(`auth-health status ${r.status}`)
  } catch (e) {
    results.steps.push({ step: 'auth-health', ok: false, error: String(e) })
    return results
  }

  // Step B: rest HEAD
  try {
    const r2 = await fetch(`${url}/rest/v1/`, { 
      method: 'HEAD',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    })
    results.steps.push({ step: 'rest-head', ok: r2.ok, status: r2.status })
    // Many setups will return 404 but still confirm reachability; treat any response as network OK
  } catch (e) {
    results.steps.push({ step: 'rest-head', ok: false, error: String(e) })
    return results
  }

  // Step C: simple DB query
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from('venues').select('*', { count: 'exact', head: false }).limit(1)
    if (error) {
      results.steps.push({ step: 'venues-select', ok: false, error: error.message })
    } else {
      results.steps.push({ step: 'venues-select', ok: true, count: data?.length ?? 0 })
    }
  } catch (e) {
    results.steps.push({ step: 'venues-select', ok: false, error: String(e) })
  }

  return results
}
