import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// GitHub Pages 子路径部署时自动加 base 前缀（本地开发保持 /）
const base = process.env.GITHUB_PAGES === "true" ? "/navigator-hub/" : "/";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base,
  build: {
    sourcemap: false,
    // 代码分割优化：按依赖拆分 chunk，利用浏览器并行下载 + 长期缓存
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('zustand') || id.includes('clsx') || id.includes('tailwind-merge')) return 'vendor-misc';
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
        },
      },
    },
    // 小于 4KB 的资源内联为 base64（减少 HTTP 请求数）
    assetsInlineLimit: 4096,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 构建报告
    reportCompressedSize: true,
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 500,
  },
  // 开发服务器：全网卡监听 + 路游侠公网映射
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    open: false,
    // 允许所有 Host 头（经路游侠代理访问时，Host 是公网域名 9614.w1.luyouxia.net）
    // 若不设会返回 403 Invalid Host header
    allowedHosts: true,
    // 路游侠公网映射信息 → 热更新 WebSocket(HMR) 必须连回公网地址，否则外网白屏
    hmr: {
      host: "9614.w1.luyouxia.net",   // 路游侠公网域名
      clientPort: 80,                 // HTTP 协议默认端口（URL 中无显式端口）
      protocol: "ws",                 // 与 HTTP 对应；若改为 HTTPS 映射则改成 wss
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
  },
  plugins: [
    react({
      // 仅在 dev 下启用源码定位插件，生产构建不注入任何调试属性（减小体积、提速）
      babel: command === 'serve'
        ? { plugins: ['react-dev-locator'] }
        : undefined,
    }),
    tsconfigPaths()
  ],
}))
