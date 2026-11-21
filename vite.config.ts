import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

// Preact with its React-compatible layer: the code is written as React, the bundle is about a fifth of the size.
// The preset aliases "react" and "react-dom" to "preact/compat".
export default defineConfig({
  plugins: [preact()],
  build: { outDir: 'dist', sourcemap: false },
});
