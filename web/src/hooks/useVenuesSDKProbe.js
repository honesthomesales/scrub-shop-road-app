// web/src/hooks/useVenuesSDKProbe.js
import { useEffect, useState } from 'react'
import { getSDK } from '../services/sharedSDKAdapter'
import { listVenues, probeConnectivity, restListVenuesRaw } from '@scrub-shop/shared-sdk'

export function useVenuesSDKProbe() {
  const [status, setStatus] = useState({ kind: 'idle', diag: null })
  useEffect(() => {
    const sdk = getSDK()
    if (!sdk) { setStatus({ kind: 'off' }); return }
    ;(async () => {
      try {
        console.group('[venues sdk probe]')
        console.log('[VITE_USE_SHARED_SDK]', import.meta.env.VITE_USE_SHARED_SDK)
        console.log('[SUPABASE_URL]', sdk.url)
        const diag = await probeConnectivity(sdk.url, sdk.anonKey)
        console.log('[connectivity]', diag)
        const stepFail = diag.steps.find(s => s.ok === false)
        if (stepFail) {
          setStatus({ kind: 'err', msg: `connectivity: ${stepFail.step}: ${stepFail.error || stepFail.status}`, diag })
          console.groupEnd()
          return
        }
        // Step C: raw REST fetch (bypasses supabase-js)
        const raw = await restListVenuesRaw({ url: sdk.url, anonKey: sdk.anonKey })
        console.log('[restListVenuesRaw]', raw)
        if (!raw.ok) {
          setStatus({ kind: 'err', msg: `raw-rest: ${raw.error || raw.status} ${raw.body || ''}`.trim(), diag: { ...diag, raw } })
          console.groupEnd()
          return
        }
        const { rows, error } = await listVenues()
        if (error) throw error
        setStatus({ kind: 'ok', count: rows?.length ?? 0, diag: { ...diag, raw } })
        console.groupEnd()
      } catch (e) {
        console.error('[venues sdk probe] failed:', e)
        setStatus({ kind: 'err', msg: e?.message || String(e), diag: status?.diag || null })
        console.groupEnd?.()
      }
    })()
  }, [])
  return status
}
