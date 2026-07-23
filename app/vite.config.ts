import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  // absolute base: relative './' breaks module resolution on deep SPA routes
  // like /planet/tatooine (assets would resolve to /planet/assets/...)
  base: '/',
  plugins: [inspectAttr(), react()],
  worker: {
    format: 'es',
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // three.js is the heavy shared dependency of the engine routes. Left
        // alone Rollup names the shared chunk after whichever module happened
        // to pull it first (it surfaced as "TopBar"), which is misleading. Pin
        // it to its own stable, correctly-named vendor chunk.
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
        },
      },
    },
  },
});
