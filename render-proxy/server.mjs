import http from "node:http";

/**
 * 智谱 GLM 代理（Railway Web Service，零依赖）
 * 官方 open.bigmodel.cn 的跨域预检不带 ACAO，浏览器无法直连。
 *
 * 环境变量：
 *   ZHIPU_API_KEY           智谱 API Key（Railway 后台配置，勿写入代码）
 *   RATE_LIMIT_PER_MIN      每 IP 每分钟对话次数上限，默认 20
 *   PORT                    Railway 自动注入
 */

const PORT = Number(process.env.PORT || 8000);
const RATE_LIMIT = Number(process.env.RATE_LIMIT_PER_MIN || 20);

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

/* ---------- 简易内存限流（单实例足够） ---------- */
const buckets = new Map();

function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) return xff.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

function allow(ip) {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
  }
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    const resetAt = now + 60_000;
    buckets.set(ip, { count: 1, resetAt });
    return { ok: true, resetAt };
  }
  if (b.count >= RATE_LIMIT) return { ok: false, resetAt: b.resetAt };
  b.count++;
  return { ok: true, resetAt: b.resetAt };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  // 健康检查与预热，不占用对话配额
  if (req.method === "GET") {
    send(res, 200, {
      ok: true,
      service: "navigator-zhipu-proxy",
      model: "glm-4-flash",
      keyConfigured: Boolean(process.env.ZHIPU_API_KEY),
      rateLimitPerMin: RATE_LIMIT,
    });
    return;
  }

  if (req.method !== "POST") {
    send(res, 405, { error: "method not allowed" });
    return;
  }

  const ip = clientIp(req);
  const rl = allow(ip);
  if (!rl.ok) {
    const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    send(res, 429, { error: "rate limited", retryAfter });
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
        stream: Boolean(body.stream),
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

    // 流式：直接透传智谱 SSE，前端逐字渲染
    if (body.stream) {
      if (!upstream.ok) {
        const text = await upstream.text();
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
      if (!upstream.body) {
        send(res, 502, { error: "no stream body" });
        return;
      }
      res.writeHead(200, {
        ...CORS,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
      try {
        for await (const chunk of upstream.body) res.write(chunk);
      } catch {
        /* 上游中断或客户端断开 */
      } finally {
        res.end();
      }
      return;
    }

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
  console.log(`[zhipu-proxy] listening on ${PORT}, rate limit ${RATE_LIMIT}/min per IP`);
});