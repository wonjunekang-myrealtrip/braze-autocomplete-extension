import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/simple.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
        name: 'BrazeAutocomplete',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      },
    },
    outDir: 'dist',
    sourcemap: false,
    minify: false,
    modulePreload: false,
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
});
