# 智谱 GLM 代理（Netlify Function）

`workers.dev` 在部分国内网络被 DNS 污染（实测解析到错误 IP、443 超时），但 `*.netlify.app` 可达，所以用 Netlify Functions 转发智谱。

## 部署（拖拽，不需要命令行）

1. 打开 https://app.netlify.com → `Add new site` → `Deploy manually`
2. 把整个 `netlify-proxy` 文件夹拖进去
3. 部署完成后，记下站点地址，例如：
   `https://sparkly-cat-123456.netlify.app`
4. 进入 `Site configuration` → `Environment variables`，添加：
   - Key：`ZHIPU_API_KEY`
   - Value：你的智谱 API Key
5. 打开 `https://<你的站点>.netlify.app/`，页面会显示完整的函数地址：
   `https://<你的站点>.netlify.app/.netlify/functions/zhipu-proxy`

## 前端配置

导航站 → AI 助手面板 → 右上角锁图标：

- `智谱 API Key`：**留空**（Key 已放在 Netlify 环境变量）
- `Worker 代理地址`：填上面那个完整函数地址

保存后状态点变紫，对话走 `glm-4-flash`。

## 说明

- Key 只存在 Netlify 环境变量，不会进浏览器、不会进代码仓库
- 函数只做转发，不落盘、不记录
- `Access-Control-Allow-Origin: *` 是有意放开；如担心滥用，可改成你的站点域名
- 免费额度足够个人导航站使用；如果调用量大，在 Netlify 后台可以看用量

## 也可以用 CLI

```bash
cd netlify-proxy
npx netlify-cli deploy --prod --dir=public --functions=functions
```