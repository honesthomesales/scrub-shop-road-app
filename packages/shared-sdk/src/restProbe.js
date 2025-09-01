export async function restListVenuesRaw({ url, anonKey }) {
  const base = (url || '').trim()
  const key = (anonKey || '').trim()
  const results = { step: 'rest-list-venues-raw' }

  try {
    const u = `${base}/rest/v1/venues?select=id&limit=1`
    const r = await fetch(u, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json'
      }
    })
    results.status = r.status
    if (!r.ok) {
      results.ok = false
      results.body = await r.text().catch(() => '')
      return results
    }
    const data = await r.json()
    results.ok = true
    results.count = Array.isArray(data) ? data.length : 0
    return results
  } catch (e) {
    results.ok = false
    results.error = String(e)
    return results
  }
}
