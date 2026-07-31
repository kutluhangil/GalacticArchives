// Vitest reuses the app's Vite config so the `@` alias, TypeScript handling and
// `import.meta.glob` (which src/lib/lore.ts depends on) behave exactly as they
// do in dev and build. Only the `test` block is added on top.

import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./test/setup.ts'],
      include: ['test/**/*.test.{ts,tsx}'],
      restoreMocks: true,
    },
  }),
)
