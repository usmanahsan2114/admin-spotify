import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react() /*, visualizer({
    open: false,
    gzipSize: true,
    brotliSize: true,
  }) */],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for security
    minify: 'terser',

    rollupOptions: {
      output: {
        /* manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material'],
          mui_icons: ['@mui/icons-material'],
          mui_grid: ['@mui/x-data-grid'],
          charts: ['recharts'],
        }, */
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
})
