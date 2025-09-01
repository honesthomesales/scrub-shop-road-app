import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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
    plugins: [react()],
    envPrefix: ['VITE_'],
    base: '',         // adjust in GH Pages workflow if needed
    server: { fs: { allow: ['..'] } },
    resolve: { preserveSymlinks: false },

    // Important: DO NOT override import.meta.env wholesale.
    // We only add concrete values for the VITE_* keys we care about.
    define: {
      ...defineEnv
    }
  })
} 