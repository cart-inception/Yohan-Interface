import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '127.0.0.1', // Force IPv4 localhost binding
    port: 5175, // Use port 5175 as default since it works
    strictPort: true, // Use exact port to avoid confusion
    open: false, // Don't auto-open browser
  },
})
