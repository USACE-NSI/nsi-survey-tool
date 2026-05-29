import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
    return {
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/survey-tool')
        },
        // NSI public API doesn't send CORS headers, so go through the dev server.
        // Production needs the same hostname reverse-proxied (or VITE_NSI_BASE set).
        '/nsiapi': {
          target: 'https://nsi.sec.usace.army.mil',
          changeOrigin: true,
          secure: true,
        },
      },
    },
}})
