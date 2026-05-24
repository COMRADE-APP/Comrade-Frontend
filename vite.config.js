import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'qomrade_symbol.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'qomrade',
        short_name: 'qomrade',
        description: 'qomrade application',
        theme_color: '#22c55e',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: "image/png",
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024 // 10 MB
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom') || id.includes('node_modules/react/')) return 'vendor';
          if (id.includes('node_modules/@emoji-mart') || id.includes('node_modules/emoji-mart')) return 'emoji';
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/recharts') || id.includes('node_modules/framer-motion')) return 'ui';
          if (id.includes('node_modules/@tiptap')) return 'tiptap';
          if (id.includes('node_modules/@stripe')) return 'stripe';
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
