/**
 * 智谱 GLM 代理（Cloudflare Worker）
 * 官方 open.bigmodel.cn 的跨域预检不带 ACAO，浏览器无法直连，需由此转发。
 *
 * 部署：见 README.md
 */
export default {
  async fetch(request, env, ctx) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };
    const json = (payload, status) =>
      new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
      });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "method not allowed" }, 405);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid json" }, 400);
    }

    const key = (body.key || env.ZHIPU_API_KEY || "").trim();
    if (!key) return json({ error: "missing Zhipu API key" }, 400);

    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) return json({ error: "messages required" }, 400);

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
      return json({ error: detail || `upstream ${upstream.status}` }, upstream.status);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return json({ error: "bad upstream json" }, 502);
    }
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) return json({ error: "empty reply" }, 502);

    return json({ reply: reply.trim() }, 200);
  },
};