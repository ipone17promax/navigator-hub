# 智谱 GLM 代理（Render 免费 Web Service）

`workers.dev` / `vercel.app` / `supabase.co` / `deno.dev` 在当前网络均不可达，`*.onrender.com` 可达，所以用 Render 做转发。

## 部署

1. 打开 https://render.com ，用 GitHub 账号登录
2. 点 `New` → `Blueprint`
3. 选择仓库 `ipone17promax/navigator-hub`
4. Render 会读取仓库根目录的 `render.yaml`，创建 `navigator-zhipu-proxy`
5. 在环境变量里填 `ZHIPU_API_KEY`（智谱 Key）
6. 点 `Deploy`，等待构建完成

部署后地址形如：

```text
https://navigator-zhipu-proxy.onrender.com
```

## 前端配置

导航站 → AI 助手面板 → 右上角锁图标：

- `智谱 API Key`：留空
- `Worker 代理地址`：填 `https://navigator-zhipu-proxy.onrender.com`

保存后状态点变紫，对话走 `glm-4-flash`。

## 免费实例休眠

Render 免费 Web Service 15 分钟无请求会休眠，下次请求冷启动约 30~60 秒。**演示前先访问一次**：

```text
https://navigator-zhipu-proxy.onrender.com
```

返回 `{ "ok": true, ... }` 即已预热。

## 本地联调

```bash
cd render-proxy
ZHIPU_API_KEY=你的Key node server.mjs
# 另开终端
curl -s -X POST http://127.0.0.1:7862 \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好"}]}'
```

## 安全

- Key 只存在 Render 环境变量，不进仓库、不进浏览器
- 代理只转发，不落盘、不记录
- CORS 放开是为了 GitHub Pages 能调用；介意可改成自己的站点域名