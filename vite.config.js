import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
    strictPort: false,
    cors: true,
    hmr: {
      host: 'localhost'
    },
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    // Allow specific Replit host and 'all' as fallback
    allowedHosts: [
      '930f0b22-8c31-476d-8440-cdeefbb2d183-00-3cryaoc99ytt6.picard.replit.dev',
      'all'
    ]
  }
})