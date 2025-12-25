import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default ({ mode }) => {
  // Load all envs, including those without VITE_ (so we can filter ourselves)
  const raw = loadEnv(mode, process.cwd(), '') // don't filter; we'll filter below

  // Keep only VITE_* to expose to the client
  const viteOnly = Object.fromEntries(
    Object.entries(raw).filter(([k]) => k.startsWith('VITE_'))
  )

  // Create define mappings that *add* concrete strings for each VITE_* key on import.meta.env
  // This is a fallback-inject: if Vite already injects them, this matches that behavior.
  const defineEnv = Object.fromEntries(
    Object.entries(viteOnly).map(([k, v]) => [
      `import.meta.env.${k}`, JSON.stringify(v ?? '')
    ])
  )

  return defineConfig({
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'offline.html'],
        strategies: 'generateSW',
        injectRegister: 'auto',
        manifest: {
          name: 'Scrub Shop Road App',
          short_name: 'Scrub Shop',
          description: 'Sales tracking and venue management for Scrub Shop',
          theme_color: '#3B82F6',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/scrub-shop-road-app/',
          scope: '/scrub-shop-road-app/',
          id: '/scrub-shop-road-app/',
          icons: [
            {
              src: '/scrub-shop-road-app/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/scrub-shop-road-app/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/scrub-shop-road-app/icon-192.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: '/scrub-shop-road-app/icon-512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: '/scrub-shop-road-app/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any'
            }
          ],
          categories: ['business', 'productivity'],
          prefer_related_applications: false
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                networkTimeoutSeconds: 10
              }
            }
          ]
        },
        devOptions: {
          enabled: false // Disable in dev to avoid service worker issues during development
        }
      })
    ],
    envPrefix: ['VITE_'],
    base: '/scrub-shop-road-app/',  // GitHub Pages base path
    server: { fs: { allow: ['..'] } },
    resolve: { preserveSymlinks: false },
    build: {
      minify: 'esbuild',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React libraries
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Chart libraries
            'vendor-charts': ['recharts'],
            // Calendar libraries
            'vendor-calendar': [
              '@fullcalendar/core',
              '@fullcalendar/react',
              '@fullcalendar/daygrid',
              '@fullcalendar/timegrid',
              '@fullcalendar/interaction'
            ],
            // Date utilities
            'vendor-dates': ['date-fns'],
            // Supabase
            'vendor-supabase': ['@supabase/supabase-js']
          }
        }
      }
    },

    // Important: DO NOT override import.meta.env wholesale.
    // We only add concrete values for the VITE_* keys we care about.
    define: {
      ...defineEnv
    }
  })
} 