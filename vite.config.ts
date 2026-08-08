import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
    // 代码分割优化：按依赖拆分 chunk，利用浏览器并行下载 + 长期缓存
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心 → 独立 chunk（极少变动，完美缓存命中）
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // 第三方库 → 独立 chunk
          'vendor-misc': ['zustand', 'clsx'],
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
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths()
  ],
})
