import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replace 'riverside-ranch' with your GitHub repo name
export default defineConfig({
  plugins: [react()],
  base: '/riverside-ranch/',
  build: {
    outDir: 'dist',
  },
});
