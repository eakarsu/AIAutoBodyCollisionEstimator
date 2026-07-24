import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Treat .js files as JSX so component files named *.js can include JSX syntax
// (required by the Estimator Views custom components).
export default defineConfig({
  plugins: [react({ include: /\.(jsx?|tsx?)$/ })],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.(jsx?|tsx?)$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.VITE_BACKEND_URL || `http://127.0.0.1:${process.env.BACKEND_PORT || 3001}`
    }
  }
})
