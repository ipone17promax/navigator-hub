# 智谱 GLM 代理（零依赖 Node 服务）

官方 `open.bigmodel.cn` 的 CORS 预检不返回 ACAO，浏览器无法直连。这个服务只做转发。

## 实测可达性（2026-11-20，国内网络）

| 平台 | 控制台 | 函数域名 | 结论 |
|---|---|---|---|
| Render | ❌ 000 | ✅ onrender.com | 控制台打不开，不可用 |
| Railway | ✅ 200 | ✅ up.railway.app 404 | **可用** |
| Koyeb | ✅ 301 | ✅ koyeb.app 404 | **可用（免费额度更久）** |
| Vercel | ✅ 200 | ❌ vercel.app 000 | 域名不可达 |
| Netlify | ✅ 200 | ✅ netlify.app | 本月额度已用尽 |
| Cloudflare | 浏览器可登录 | ❌ workers.dev 000 | 域名不可达 |
| Deno | ✅ 301 | ❌ deno.dev 000 | 域名不可达 |

## Railway 部署（推荐，最简单）

1. 打开 https://railway.com ，用 GitHub 登录
2. `New Project` → `Deploy from GitHub repo` → 选 `ipone17promax/navigator-hub`
3. 服务 → `Settings` → `Root Directory` 填 `render-proxy`
4. `Variables` → 新增 `ZHIPU_API_KEY` = 智谱 Key
5. `Settings` → `Networking` → `Generate Domain`
6. 得到 `https://xxxx.up.railway.app`

Railway 读取 `render-proxy/railway.json`，启动命令 `node server.mjs`，健康检查 `/`。

费用：Railway 新账号有 $5 试用额度，低流量代理通常能撑很久；用量在 `Usage` 里可看。

## Koyeb 部署（免费额度更持久）

1. 打开 https://koyeb.com ，用 GitHub 登录
2. `Create Service` → `GitHub` → 选仓库
3. 构建方式选 `Dockerfile`，Dockerfile 路径 `render-proxy/Dockerfile`，工作目录 `render-proxy`
4. 环境变量 `ZHIPU_API_KEY`
5. 端口 `8000`（服务自动注入 `PORT`）
6. 部署后得到 `https://xxxx.koyeb.app`

免费实例会 scale-to-zero，冷启动约 10~30 秒，演示前先访问一次 `/` 预热。

## 本地运行（零成本，已实测）

```bash
cd render-proxy
ZHIPU_API_KEY=你的Key node server.mjs
```

```bash
curl -s http://127.0.0.1:7862/
curl -s -X POST http://127.0.0.1:7862/ \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好"}]}'
```

## 前端配置

AI 助手面板 → 锁图标：

- `智谱 API Key`：留空（Key 在服务端环境变量）
- `Worker 代理地址`：`https://xxxx.up.railway.app` 或 `https://xxxx.koyeb.app`

## 安全

- Key 只存在平台环境变量，不进仓库、不进浏览器
- 服务只转发，不落盘、不记录
- CORS 放开是为了 GitHub Pages 调用；介意可改成自己的站点域名