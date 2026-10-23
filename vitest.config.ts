import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The repository root: vitest.config.ts lives in the project root,
// so the dirname of its absolute file URL is the repository root.
const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/vitest.setup.ts'],
    include: ['tests/**/*.test.ts'],
    css: false,
    root,
    // Vitest test.alias rewrites '@/' imports to the project source tree
    // BEFORE Vite's import-analysis, so route handlers resolve '@/lib/*'.
    // The string find matches the leading '@/' prefix; replacement is the
    // project directory with forward slashes (Vite requirement on Windows).
    // Using path.posix to build a forward-slash path without regex.
    alias: [
      { find: '@/', replacement: path.posix.join(path.resolve(root, '.'), '.') + '/' },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
})
