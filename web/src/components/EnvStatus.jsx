import React from 'react'

export default function EnvStatus() {
  const env = import.meta.env;
  const required = ['VITE_SUPABASE_URL', 'VITE_USE_SHARED_SDK'];
  const missing = required.filter(k => !env[k] || String(env[k]).trim() === '');
  const useShared = env.VITE_USE_SHARED_SDK
  const url = env.VITE_SUPABASE_URL

  return (
    <div style={{
      position:'fixed', bottom: 12, right: 12, padding: '8px 12px',
      borderRadius: 8, background: missing.length ? '#ffe8e8' : '#e8ffe8',
      color: '#222', fontSize: 12, zIndex: 9999, boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <div><strong>EnvStatus:</strong> {missing.length ? 'Missing' : 'OK'}</div>
      {missing.length ? <div>Missing: {missing.join(', ')}</div> : (
        <>
          <div>VITE_USE_SHARED_SDK: {String(useShared)}</div>
          <div>VITE_SUPABASE_URL: {url}</div>
        </>
      )}
    </div>
  )
}
