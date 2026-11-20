import http from "node:http";

/**
 * 智谱 GLM 代理（Render Web Service，零依赖）
 * 官方 open.bigmodel.cn 的跨域预检不带 ACAO，浏览器无法直连。
 *
 * 环境变量：
 *   ZHIPU_API_KEY  智谱 API Key（Render 后台配置，勿写入代码）
 *   PORT           Render 自动注入
 */

const PORT = Number(process.env.PORT || 7862);
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...CORS,
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  // 健康检查也是预热入口（Render 免费实例会休眠）
  if (req.method === "GET") {
    send(res, 200, {
      ok: true,
      service: "navigator-zhipu-proxy",
      model: "glm-4-flash",
      keyConfigured: Boolean(process.env.ZHIPU_API_KEY),
    });
    return;
  }

  if (req.method !== "POST") {
    send(res, 405, { error: "method not allowed" });
    return;
  }

  let body;
  try {
    body = JSON.parse((await readBody(req)) || "{}");
  } catch {
    send(res, 400, { error: "invalid json" });
    return;
  }

  const key = String(body.key || process.env.ZHIPU_API_KEY || "").trim();
  if (!key) {
    send(res, 400, { error: "missing Zhipu API key" });
    return;
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) {
    send(res, 400, { error: "messages required" });
    return;
  }

  try {
    const upstream = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: body.model || "glm-4-flash",
        messages: [
          {
            role: "system",
            content:
              "你是 NavigatorHub 导航站的 AI 助手，回答简洁、诚实，使用中文。不要冒充其他厂商产品。",
          },
          ...messages,
        ],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      let detail = text.slice(0, 300);
      try {
        const e = JSON.parse(text);
        detail = e?.error?.message || e?.message || detail;
      } catch {
        /* keep raw */
      }
      send(res, upstream.status, { error: detail || `upstream ${upstream.status}` });
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      send(res, 502, { error: "bad upstream json" });
      return;
    }
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      send(res, 502, { error: "empty reply" });
      return;
    }

    send(res, 200, { reply: reply.trim() });
  } catch (err) {
    send(res, 500, { error: `proxy error: ${err?.message || err}` });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[zhipu-proxy] listening on ${PORT}`);
});