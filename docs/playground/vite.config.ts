import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages 构建时资源前缀必须与仓库名一致，否则线上 JS/CSS 会 404；
  // 本地开发与预览仍使用根路径，保持原有启动方式不变。
  base: process.env.GITHUB_ACTIONS === 'true' ? '/Temp-BoomCat/' : '/',
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
