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
          // Wait a bit for service worker to potentially register
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const registrations = await navigator.serviceWorker.getRegistrations()
          if (registrations.length > 0) {
            const registration = registrations[0]
            const worker = registration.active || registration.installing || registration.waiting
            if (worker) {
              if (worker.state === 'activated') {
                results.serviceWorker = 'active'
              } else {
                results.serviceWorker = `${worker.state}`
                if (worker.state !== 'activated') {
                  results.errors.push(`Service Worker is ${worker.state}, needs to be activated`)
                }
              }
            } else {
              results.serviceWorker = 'no-worker'
              results.errors.push('Service Worker registered but no worker instance found')
            }
          } else {
            results.serviceWorker = 'not-registered'
            results.errors.push('Service Worker not registered - check if registerSW.js loaded')
          }
        } catch (error) {
          results.serviceWorker = 'error'
          results.errors.push(`Service Worker error: ${error.message}`)
        }
      } else {
        results.serviceWorker = 'not-supported'
        results.errors.push('Service Workers not supported in this browser')
      }

      // Check Manifest - try multiple methods
      try {
        // Method 1: Check if browser already loaded it
        const manifestLink = document.querySelector('link[rel="manifest"]')
        if (manifestLink) {
          const htmlManifestPath = manifestLink.getAttribute('href')
          console.log('📋 HTML manifest link:', htmlManifestPath)
        }
        
        // Method 2: Try fetching from various paths
        const manifestPaths = [
          '/scrub-shop-road-app/manifest.webmanifest',
          '/manifest.webmanifest',
          './manifest.webmanifest',
          'manifest.webmanifest'
        ]
        
        let manifestFound = false
        let lastError = null
        for (const manifestPath of manifestPaths) {
          try {
            const response = await fetch(manifestPath)
            const responseInfo = {
              status: response.status,
              statusText: response.statusText,
              ok: response.ok,
              contentType: response.headers.get('content-type'),
              url: response.url
            }
            console.log(`🔍 Trying manifest path: ${manifestPath}`, responseInfo)
            
            // Log to errors for user visibility
            if (!response.ok) {
              const errorMsg = `${manifestPath}: HTTP ${response.status} ${response.statusText}`
              results.errors.push(errorMsg)
              console.error('❌', errorMsg)
              lastError = errorMsg
            }
            
            if (response.ok) {
              const contentType = response.headers.get('content-type')
              if (!contentType || (!contentType.includes('json') && !contentType.includes('text'))) {
                results.errors.push(`Manifest has wrong content-type: ${contentType || 'none'}`)
                lastError = `Wrong content-type: ${contentType}`
                continue // Try next path
              }
              
              try {
                const manifest = await response.json()
                if (!manifest.name || !manifest.icons) {
                  throw new Error('Invalid manifest: missing required fields')
                }
                results.manifest = 'accessible'
                manifestFound = true
                console.log('✅ Manifest is accessible at:', manifestPath, manifest)
              } catch (jsonError) {
                results.errors.push(`Manifest JSON parse error: ${jsonError.message}`)
                lastError = `JSON parse error: ${jsonError.message}`
                continue // Try next path
              }
              
              // Log manifest details
              console.log('📋 Manifest loaded:', {
                name: manifest.name,
                start_url: manifest.start_url,
                scope: manifest.scope,
                display: manifest.display,
                icons: manifest.icons?.length || 0
              })
              
              // Check icons
              if (manifest.icons && manifest.icons.length > 0) {
                let iconErrors = 0
                let iconSuccess = 0
                for (const icon of manifest.icons.slice(0, 2)) { // Check first 2 icons
                  try {
                    // Try absolute path first, then relative
                    const iconPaths = [
                      icon.src.startsWith('/') ? icon.src : `/${icon.src}`,
                      icon.src,
                      `/scrub-shop-road-app/${icon.src.replace(/^\//, '')}`
                    ]
                    
                    let iconFound = false
                    for (const iconPath of iconPaths) {
                      try {
                        const iconResponse = await fetch(iconPath)
                        if (iconResponse.ok) {
                          iconSuccess++
                          iconFound = true
                          break
                        }
                      } catch (e) {
                        // Try next path
                      }
                    }
                    
                    if (!iconFound) {
                      iconErrors++
                      results.errors.push(`Icon not accessible: ${icon.src} (tried: ${iconPaths.join(', ')})`)
                    }
                  } catch (error) {
                    iconErrors++
                    results.errors.push(`Icon error: ${icon.src} - ${error.message}`)
                  }
                }
                if (iconErrors === 0) {
                  results.icons = 'accessible'
                } else {
                  results.icons = 'some-errors'
                }
              } else {
                results.icons = 'missing'
                results.errors.push('No icons in manifest')
              }
              break
            } else {
              lastError = `Status ${response.status}: ${response.statusText}`
              results.errors.push(`${manifestPath}: ${response.status} ${response.statusText}`)
            }
          } catch (e) {
            lastError = e.message
            results.errors.push(`${manifestPath}: ${e.message}`)
            // Try next path
            continue
          }
        }
        
        if (!manifestFound) {
          results.manifest = 'not-accessible'
          results.errors.push(`Manifest not found. Last error: ${lastError || 'unknown'}`)
          
          // Also try to check what the HTML says
          const manifestLink = document.querySelector('link[rel="manifest"]')
          if (manifestLink) {
            const htmlManifestPath = manifestLink.getAttribute('href')
            results.errors.push(`HTML manifest link: ${htmlManifestPath}`)
            
            // Try to access it directly
            try {
              const directUrl = new URL(htmlManifestPath, window.location.origin).href
              results.errors.push(`Try accessing: ${directUrl}`)
            } catch (e) {
              // Ignore
            }
          } else {
            results.errors.push('No manifest link found in HTML!')
          }
          
          // Check if browser can detect manifest
          if ('serviceWorker' in navigator && 'getManifest' in navigator.serviceWorker) {
            try {
              // This might not work in all browsers, but worth trying
              results.errors.push('Note: Check Chrome DevTools → Application → Manifest tab')
            } catch (e) {
              // Ignore
            }
          }
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

    // Run diagnostics immediately and then again after delays
    runDiagnostics()
    const timer1 = setTimeout(runDiagnostics, 2000)
    const timer2 = setTimeout(runDiagnostics, 5000)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  // Always show diagnostics for now to help debug
  // if (diagnostics.installable === 'yes' && diagnostics.errors.length === 0) {
  //   return null
  // }

  const getStatusColor = (status) => {
    if (status === 'active' || status === 'accessible' || status === 'yes') return 'text-green-600'
    if (status === 'checking' || status?.includes('checking')) return 'text-yellow-600'
    if (status?.startsWith('accessible')) return 'text-green-600' // Handle "accessible (path)" format
    return 'text-red-600'
  }

  const getStatusIcon = (status) => {
    if (status === 'active' || status === 'accessible' || status === 'yes') return '✅'
    if (status === 'checking' || status?.includes('checking')) return '⏳'
    if (status?.startsWith('accessible')) return '✅' // Handle "accessible (path)" format
    return '❌'
  }

  return (
    <div className="fixed top-20 right-4 bg-white border-2 border-blue-300 rounded-lg shadow-xl p-4 z-50 max-w-sm text-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">PWA Diagnostics</h3>
        <button
          onClick={() => setDiagnostics({ serviceWorker: 'checking', manifest: 'checking', icons: 'checking', installable: 'checking', errors: [] })}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Refresh
        </button>
      </div>
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

