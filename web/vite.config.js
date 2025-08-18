import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: process.env.NODE_ENV === 'production' ? '/scrub-shop-road-app/offline.html' : '/offline.html'
      },
      manifest: {
        name: 'Scrub Shop Road App',
        short_name: 'Scrub Shop',
        description: 'Sales tracking and venue management for Scrub Shop',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: process.env.NODE_ENV === 'production' ? '/scrub-shop-road-app/' : '/',
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow external connections
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}) 