import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        productSearch: resolve(__dirname, 'src/content/productSearch.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
      },
    },
    outDir: 'dist',
    sourcemap: false,
    minify: false,
    modulePreload: false,
    emptyOutDir: false,
  },
});
