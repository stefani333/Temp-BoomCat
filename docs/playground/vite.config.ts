import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // 独立预览端口，避开主工程使用的 5173、5174
    port: 5181,
    strictPort: true,
  },
  preview: {
    port: 5181,
    strictPort: true,
  },
});
