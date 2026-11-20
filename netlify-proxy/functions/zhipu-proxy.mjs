/**
 * 智谱 GLM 代理（Netlify Function）
 * 官方 open.bigmodel.cn 的 CORS 预检不带 ACAO，浏览器无法直连。
 *
 * 部署见 README.md；函数地址：
 *   https://<你的站点>.netlify.app/.netlify/functions/zhipu-proxy
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const json = (statusCode, payload) => ({
  statusCode,
  headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { error: "method not allowed" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "invalid json" });
  }

  const key = String(body.key || process.env.ZHIPU_API_KEY || "").trim();
  if (!key) return json(400, { error: "missing Zhipu API key" });

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) return json(400, { error: "messages required" });

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
    return json(upstream.status, { error: detail || `upstream ${upstream.status}` });
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return json(502, { error: "bad upstream json" });
  }
  const reply = data?.choices?.[0]?.message?.content;
  if (typeof reply !== "string" || !reply.trim()) return json(502, { error: "empty reply" });

  return json(200, { reply: reply.trim() });
}