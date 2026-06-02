import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // bind to 0.0.0.0 — required inside Docker
    port: 5173,
    watch: {
      usePolling: true, // needed on Windows / Docker volume mounts for HMR
    },
    proxy: {
      // Forward /uploads/* to the backend so uploaded images resolve correctly
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
})
