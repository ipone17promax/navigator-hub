# 智谱 GLM 代理（Cloudflare Worker）

官方 `open.bigmodel.cn` 的 CORS 预检不返回 `Access-Control-Allow-Origin`，浏览器无法直连。
这个 Worker 只做一件事：接收前端请求，转发到智谱，并把结果返回。

## 部署

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

部署成功后会得到一个地址，例如：

```text
https://navigator-zhipu-proxy.<你的账号>.workers.dev
```

## 前端配置

打开导航站的 AI 助手面板 → 点右上角锁图标：

- `智谱 API Key`：`open.bigmodel.cn` 控制台创建的 Key
- `Worker 代理地址`：上一步得到的 `https://...workers.dev`

保存后状态点变紫，对话走 `glm-4-flash`。

## 安全说明

- Key 由前端随请求体发送到**你自己的 Worker**，不会写进代码仓库
- Worker 只在转发时使用 Key，不落盘、不记录
- 也可以把 Key 配成 Worker 的 Secret（`npx wrangler secret put ZHIPU_API_KEY`），前端 `key` 字段留空即可
- `Access-Control-Allow-Origin: *` 是有意放开，方便 GitHub Pages 等任意静态站调用；如果担心滥用，可改成你的站点域名

## 国内网络提示

`*.workers.dev` 在部分国内网络会被 DNS 拦截。若打不开，可绑定自定义域名，或改用可访问的 Serverless 平台（Vercel / Deno Deploy）重写同一转发逻辑。