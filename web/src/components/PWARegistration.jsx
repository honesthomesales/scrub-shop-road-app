import { useEffect, useState } from 'react'

const PWARegistration = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [swStatus, setSwStatus] = useState('checking')
  const [showManualInstall, setShowManualInstall] = useState(false)

  useEffect(() => {
    // Global error handlers for better mobile error handling
    const handleError = (event) => {
      console.error('Global error:', event.error, event.message)
      event.preventDefault()
    }

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      event.preventDefault()
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Check service worker status
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // Wait for page to fully load
          if (document.readyState === 'loading') {
            await new Promise(resolve => window.addEventListener('load', resolve))
          }

          // Check for existing registrations
          const registrations = await navigator.serviceWorker.getRegistrations()
          
          if (registrations.length > 0) {
            const registration = registrations[0]
            const worker = registration.active || registration.installing || registration.waiting
            
            if (worker) {
              console.log('✅ Service Worker found:', {
                state: worker.state,
                scope: registration.scope,
                scriptURL: worker.scriptURL
              })
              
              // Wait for service worker to be activated
              if (worker.state === 'activated') {
                setSwStatus('active')
                console.log('✅ Service Worker is active and ready')
              } else if (worker.state === 'activating') {
                worker.addEventListener('statechange', () => {
                  if (worker.state === 'activated') {
                    setSwStatus('active')
                    console.log('✅ Service Worker activated')
                  }
                })
              } else {
                setSwStatus('installing')
                worker.addEventListener('statechange', () => {
                  if (worker.state === 'activated') {
                    setSwStatus('active')
                    console.log('✅ Service Worker activated')
                  }
                })
              }
            } else {
              setSwStatus('waiting')
              console.log('⚠️ Service Worker registered but not active yet')
            }
          } else {
            setSwStatus('not-registered')
            console.log('⚠️ No service worker registered - will be registered on production build')
          }
        } catch (error) {
          console.error('❌ Service Worker check failed:', error)
          setSwStatus('error')
        }
      } else {
        console.log('⚠️ Service Workers not supported in this browser')
        setSwStatus('not-supported')
      }
    }

    // Check installability criteria
    const checkInstallability = async () => {
      if (!('serviceWorker' in navigator)) {
        console.log('⚠️ Service Workers not supported')
        return
      }

      try {
        // Check if manifest is accessible (use full path with base)
        const manifestPath = '/scrub-shop-road-app/manifest.webmanifest'
        const manifestResponse = await fetch(manifestPath)
        if (!manifestResponse.ok) {
          console.error('❌ Manifest not accessible:', manifestResponse.status, manifestPath)
          return
        }
        const manifest = await manifestResponse.json()
        console.log('✅ Manifest accessible:', manifest.name)
        console.log('📋 Manifest details:', {
          start_url: manifest.start_url,
          scope: manifest.scope,
          display: manifest.display,
          icons: manifest.icons?.length || 0
        })

        // Check if icons are accessible
        const icon192 = manifest.icons?.find(icon => icon.sizes === '192x192')
        const icon512 = manifest.icons?.find(icon => icon.sizes === '512x512')
        
        if (icon192) {
          const iconResponse = await fetch(icon192.src)
          if (!iconResponse.ok) {
            console.error('❌ Icon 192x192 not accessible')
            return
          }
        }
        
        if (icon512) {
          const iconResponse = await fetch(icon512.src)
          if (!iconResponse.ok) {
            console.error('❌ Icon 512x512 not accessible')
            return
          }
        }

        console.log('✅ All PWA criteria met - app should be installable')
        setIsInstallable(true)
      } catch (error) {
        console.error('❌ Installability check failed:', error)
      }
    }

    // Handle the beforeinstallprompt event (Android Chrome)
    const handleBeforeInstallPrompt = (e) => {
      console.log('✅ beforeinstallprompt event fired - PWA is installable!')
      console.log('Event details:', {
        platforms: e.platforms,
        userChoice: 'Will be available after prompt()'
      })
      
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      setIsInstallable(true)
      
      // Show the install prompt after a short delay to ensure UI is ready
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, 1000)
    }

    // Handle the appinstalled event
    const handleAppInstalled = () => {
      console.log('✅ PWA was installed successfully')
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
      setIsInstallable(false)
    }

    // Check if app is already installed (standalone mode)
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('ℹ️ App is already installed (standalone mode)')
        setIsInstallable(false)
        return true
      }
      
      // Check for iOS standalone mode
      if (window.navigator.standalone === true) {
        console.log('ℹ️ App is already installed (iOS standalone mode)')
        setIsInstallable(false)
        return true
      }
      
      return false
    }

    // Initialize checks
    if (!checkIfInstalled()) {
      checkServiceWorker()
      checkInstallability()
      
      // Listen for the beforeinstallprompt event (Android Chrome)
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      
      // Listen for the appinstalled event
      window.addEventListener('appinstalled', handleAppInstalled)
      
      // Check if app is installable after a delay (in case beforeinstallprompt hasn't fired yet)
      // Chrome may not fire the event immediately due to engagement heuristics
      setTimeout(() => {
        if (isInstallable && !deferredPrompt) {
          console.log('ℹ️ App is installable but beforeinstallprompt has not fired yet')
          console.log('ℹ️ This is normal - Chrome uses engagement heuristics')
          console.log('ℹ️ Users can still install via Chrome menu → "Install app"')
        }
      }, 5000)
    }

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('⚠️ No install prompt available')
      return
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt()

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice

      console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`)

      // Clear the deferredPrompt
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error('❌ Error showing install prompt:', error)
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Don't clear deferredPrompt - user might want to install later
    // The prompt can be shown again if needed
  }

  const handleManualInstallDismiss = () => {
    setShowManualInstall(false)
    console.log('Manual install prompt dismissed')
  }

  // Show manual install button if app is installable but beforeinstallprompt hasn't fired
  useEffect(() => {
    // Show manual install button if app is installable but prompt hasn't fired after 3 seconds
    if (isInstallable && !deferredPrompt && !showInstallPrompt) {
      const timer = setTimeout(() => {
        console.log('Showing manual install button - beforeinstallprompt has not fired')
        setShowManualInstall(true)
      }, 3000)
      return () => clearTimeout(timer)
    } else {
      setShowManualInstall(false)
    }
  }, [isInstallable, deferredPrompt, showInstallPrompt])

  // Show install prompt if beforeinstallprompt fired
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 md:max-w-md md:left-auto md:right-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Install Scrub Shop App</h3>
            <p className="text-sm opacity-90 mt-1">Add to home screen for quick access</p>
          </div>
          <div className="flex space-x-2 ml-4">
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-sm bg-blue-700 hover:bg-blue-800 rounded transition-colors min-h-[44px] min-w-[80px] touch-manipulation"
              aria-label="Dismiss install prompt"
            >
              Not now
            </button>
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 text-sm bg-white text-blue-600 hover:bg-gray-100 rounded transition-colors min-h-[44px] min-w-[80px] font-medium touch-manipulation"
              aria-label="Install app"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show manual install button when app is installable but prompt hasn't fired
  if (showManualInstall) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 md:max-w-md md:left-auto md:right-4 animate-slide-up">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h3 className="font-semibold text-lg mb-2">Install Scrub Shop App</h3>
            <div className="text-sm opacity-90 space-y-1">
              <p>1. Tap the 3-dot menu (⋮) in the top right</p>
              <p>2. Select "Add to Home Screen"</p>
              <p className="text-xs opacity-75 mt-2">The app will install and work like a native app!</p>
            </div>
          </div>
          <button
            onClick={handleManualInstallDismiss}
            className="px-3 py-2 text-sm bg-green-700 hover:bg-green-800 rounded transition-colors min-h-[44px] min-w-[60px] touch-manipulation flex-shrink-0"
            aria-label="Dismiss"
          >
            Got it
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default PWARegistration
