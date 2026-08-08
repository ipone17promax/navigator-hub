/**
 * NavigatorHub Service Worker — 后台真实加速引擎
 * 策略：
 *   1. 静态资源（JS/CSS/字体/图片）→ Cache-First（秒开）
 *   2. HTML 导航页面 → Network-First + 缓存兜底（离线可用）
 *   3. 第三方请求 → Stale-While-Revalidate（后台静默更新）
 *   4. 安装时预缓存核心资源
 *   5. 激活时清理旧版本缓存
 */

const SW_VERSION = 'navigator-hub-v3-20260804';
const CORE_CACHE = `${SW_VERSION}-core`;
const RUNTIME_CACHE = `${SW_VERSION}-runtime`;

// 预缓存的核心资源（安装时拉取）
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
];

// 静态资源匹配规则
const STATIC_ASSET_PATTERN = /\.(?:js|css|woff2?|ttf|otf|svg|png|jpg|jpeg|gif|webp|avif|ico)$/;
// 导航请求匹配
const NAVIGATION_REQUEST = (req) => req.mode === 'navigate';

// ============================================================
// 安装：预缓存核心资源 → 跳过等待立即激活
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => console.warn('[SW] 预缓存部分失败（不影响运行）:', err))
  );
  self.skipWaiting(); // 立即激活新版本
});

// ============================================================
// 激活：清理旧缓存 → 立即接管所有页面
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => !key.startsWith(SW_VERSION))
          .map((key) => {
            console.log('[SW] 清理旧缓存:', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim()) // 立即接管所有客户端
  );
});

// ============================================================
// 请求拦截：根据类型分流到不同缓存策略
// ============================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 只处理 GET 请求
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 跳过 Vite HMR / 开发请求
  if (url.pathname.includes('/@vite') || url.pathname.includes('/@react')) return;

  // ---------- 策略1：HTML 导航 → Network-First ----------
  if (NAVIGATION_REQUEST(request)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // ---------- 策略2：静态资源 → Cache-First ----------
  if (STATIC_ASSET_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // ---------- 策略3：同源请求 → Stale-While-Revalidate ----------
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidateStrategy(request));
    return;
  }

  // ---------- 策略4：第三方资源 → Stale-While-Revalidate ----------
  event.respondWith(staleWhileRevalidateStrategy(request));
});

// ============================================================
// 策略实现
// ============================================================

/**
 * Cache-First：先查缓存，命中直接返回；未命中走网络并缓存
 * 适用于：JS、CSS、字体、图片（不可变资源）
 */
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // 离线兜底：返回一个空白响应，避免页面报错
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

/**
 * Network-First：先走网络获取最新内容；网络失败时回退缓存
 * 适用于：HTML 导航页面（保证用户看到最新内容，离线时仍可访问）
 */
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CORE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // 最终兜底：返回缓存的首页
    const fallback = await caches.match('/index.html');
    return fallback || new Response('离线模式', { status: 503 });
  }
}

/**
 * Stale-While-Revalidate：立即返回缓存（如有），同时后台更新
 * 适用于：第三方资源、API（兼顾速度与新鲜度）
 */
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached); // 网络失败时静默返回缓存

  // 有缓存就立即返回，后台静默更新
  return cached || fetchPromise;
}

// ============================================================
// 消息通信：支持手动清理缓存 / 强制更新
// ============================================================
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.map((key) => caches.delete(key)))
      ).then(() => {
        console.log('[SW] 所有缓存已手动清空');
      })
    );
  }
});
