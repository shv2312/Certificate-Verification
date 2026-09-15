import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // PROXY ASSUMPTION: The frontend and backend run on the same local machine
      // during development. If testing from an external device (e.g. mobile phone),
      // the backend must bind to 0.0.0.0 and this target must be updated to the
      // backend machine's local IP address.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
