import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // absolute base: relative './' breaks module resolution on deep SPA routes
  // like /planet/tatooine (assets would resolve to /planet/assets/...)
  base: '/',
  plugins: [react()],
  worker: {
    format: 'es',
  },
  server: {
    port: 5173,
    strictPort: true,
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
          // KTX2Loader + its basis transcoder glue are only needed once a
          // world ships .ktx2 maps; keep them out of the always-loaded three
          // chunk so they split into a dynamic chunk (see planet-textures.ts).
          if (id.includes('node_modules/three/examples/jsm/loaders/KTX2Loader')) return
          if (id.includes('node_modules/three')) return 'three'
          // the hyperlane network is the largest single data file and grows
          // with every lane charted; its own chunk keeps that growth visible
          // to the bundle budget instead of hiding it inside the galaxy route
          if (id.includes('src/data/routes.json')) return 'routes'
        },
      },
    },
  },
});
