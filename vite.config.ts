import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: 'Pdf-Image-Adder',
  build: {
    outDir: 'dist',
  },
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  });
