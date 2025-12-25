import { useEffect, useState } from 'react'

const PWADiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState({
    serviceWorker: 'checking',
    manifest: 'checking',
    icons: 'checking',
    installable: 'checking',
    errors: []
  })

  useEffect(() => {
    const runDiagnostics = async () => {
      const results = {
        serviceWorker: 'checking',
        manifest: 'checking',
        icons: 'checking',
        installable: 'checking',
        errors: []
      }

      // Check Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations()
          if (registrations.length > 0) {
            const registration = registrations[0]
            const worker = registration.active || registration.installing || registration.waiting
            if (worker && worker.state === 'activated') {
              results.serviceWorker = 'active'
            } else {
              results.serviceWorker = worker?.state || 'waiting'
            }
          } else {
            results.serviceWorker = 'not-registered'
            results.errors.push('Service Worker not registered')
          }
        } catch (error) {
          results.serviceWorker = 'error'
          results.errors.push(`Service Worker error: ${error.message}`)
        }
      } else {
        results.serviceWorker = 'not-supported'
        results.errors.push('Service Workers not supported')
      }

      // Check Manifest
      try {
        const manifestPath = '/scrub-shop-road-app/manifest.webmanifest'
        const response = await fetch(manifestPath)
        if (response.ok) {
          const manifest = await response.json()
          results.manifest = 'accessible'
          
          // Check icons
          if (manifest.icons && manifest.icons.length > 0) {
            let iconErrors = 0
            for (const icon of manifest.icons.slice(0, 2)) { // Check first 2 icons
              try {
                const iconResponse = await fetch(icon.src)
                if (!iconResponse.ok) {
                  iconErrors++
                  results.errors.push(`Icon not accessible: ${icon.src}`)
                }
              } catch (error) {
                iconErrors++
                results.errors.push(`Icon error: ${icon.src}`)
              }
            }
            results.icons = iconErrors === 0 ? 'accessible' : 'some-errors'
          } else {
            results.icons = 'missing'
            results.errors.push('No icons in manifest')
          }
        } else {
          results.manifest = 'not-accessible'
          results.errors.push(`Manifest not accessible: ${response.status}`)
        }
      } catch (error) {
        results.manifest = 'error'
        results.errors.push(`Manifest error: ${error.message}`)
      }

      // Check installability
      if (results.serviceWorker === 'active' && results.manifest === 'accessible' && results.icons === 'accessible') {
        results.installable = 'yes'
      } else {
        results.installable = 'no'
      }

      setDiagnostics(results)
    }

    // Run diagnostics after a short delay to allow service worker to register
    const timer = setTimeout(runDiagnostics, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Only show if there are errors or if not installable
  if (diagnostics.installable === 'yes' && diagnostics.errors.length === 0) {
    return null
  }

  const getStatusColor = (status) => {
    if (status === 'active' || status === 'accessible' || status === 'yes') return 'text-green-600'
    if (status === 'checking') return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusIcon = (status) => {
    if (status === 'active' || status === 'accessible' || status === 'yes') return '✅'
    if (status === 'checking') return '⏳'
    return '❌'
  }

  return (
    <div className="fixed top-20 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-sm text-xs">
      <h3 className="font-semibold mb-2 text-sm">PWA Diagnostics</h3>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Service Worker:</span>
          <span className={getStatusColor(diagnostics.serviceWorker)}>
            {getStatusIcon(diagnostics.serviceWorker)} {diagnostics.serviceWorker}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Manifest:</span>
          <span className={getStatusColor(diagnostics.manifest)}>
            {getStatusIcon(diagnostics.manifest)} {diagnostics.manifest}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Icons:</span>
          <span className={getStatusColor(diagnostics.icons)}>
            {getStatusIcon(diagnostics.icons)} {diagnostics.icons}
          </span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Installable:</span>
          <span className={getStatusColor(diagnostics.installable)}>
            {getStatusIcon(diagnostics.installable)} {diagnostics.installable}
          </span>
        </div>
      </div>
      {diagnostics.errors.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-red-600 text-xs">
            <div className="font-semibold mb-1">Errors:</div>
            {diagnostics.errors.map((error, idx) => (
              <div key={idx} className="mb-1">• {error}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PWADiagnostics

