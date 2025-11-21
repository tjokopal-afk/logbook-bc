import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    // Force fresh reload on file changes
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true
    }
  },
  build: {
    // Disable minification for debugging
    minify: false,
    // Generate source maps
    sourcemap: true
  }
})
