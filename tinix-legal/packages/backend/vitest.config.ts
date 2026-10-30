import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // vitest's default exclude list doesn't cover `dist/`, so a local `tsc`
    // build leaves compiled test doubles under dist/tests/*.test.js that get
    // picked up and run alongside the real src/tests/*.test.ts — often
    // stale relative to the source they were built from.
    exclude: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
  },
});
