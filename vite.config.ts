import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves at /lottoslips/ — absolute base avoids "./" breaking
// when the URL has no trailing slash (which caused Forbidden/404 on assets).
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
