import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Vite blocks unrecognized Host headers by default; this dev sandbox is
    // reached through a proxy domain, not localhost, so allow that pattern.
    allowedHosts: ['.devspaces.amazon.dev'],
  },
})
