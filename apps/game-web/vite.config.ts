import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages 子路径部署：游戏端挂在仓库地址下的 /game/；
  // 本地开发与预览仍使用根路径，保持 http://localhost:5200/ 不变。
  base: process.env.GITHUB_ACTIONS === 'true' ? '/Temp-BoomCat/game/' : '/',
  plugins: [react()],
  server: {
    port: 5200,
    strictPort: true,
  },
});
