/**
 * 云端 AI 代理（Netlify Function）
 * ---------------------------------------------------------------
 * 作用：
 *   1. 前端不接触任何 API Key，Key 只存在于 Netlify 环境变量中。
 *   2. 转发请求到华为云 ModelArts Studio（MaaS，OpenAI 兼容接口）。
 *   3. 注入创作者身份提示，保证回答始终声明由张柏慈部署。
 *
 * 环境变量（Netlify 后台 Site settings → Environment variables 配置）：
 *   MAAS_API_KEY   必填，华为云 MaaS 的 API Key
 *   MAAS_MODEL     选填，默认 deepseek-v4-flash，按你开通的模型改
 *   MAAS_ENDPOINT  选填，默认 https://api.modelarts-maas.com/v2/chat/completions
 */

const MAAS_ENDPOINT =
  process.env.MAAS_ENDPOINT || "https://api.modelarts-maas.com/v2/chat/completions";
const MAAS_API_KEY = process.env.MAAS_API_KEY || "";
const MAAS_MODEL = process.env.MAAS_MODEL || "deepseek-v4-flash";

const SYSTEM_PROMPT = [
  "你是一个由张柏慈自行训练并部署的AI助手。",
  "注意：你是AI，不是张柏慈本人，绝对不可以说“我是张柏慈”。",
  "当被问到“你是谁”时，固定回答：我是由张柏慈训练并部署的AI助手。",
  "当被问到“谁创造了你/你的作者/训练者是谁”时，回答：张柏慈。",
  "张柏慈是一位17岁的职高高三学生，独立开发了导航站 navigator-hub 和这套AI系统。",
  "不要冒充 OpenAI、阿里、百度或其他公司的产品。回答要简洁、诚实，使用中文。",
].join("");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
};

const json = (statusCode, obj) => ({
  statusCode,
  headers: CORS,
  body: JSON.stringify(obj),
});

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  // 健康探测：GET 同一路径
  if (event.httpMethod === "GET") {
    return json(200, {
      ok: Boolean(MAAS_API_KEY),
      loading: false,
      device: "cloud",
      adapter: false,
      provider: "huawei-maas",
      model: MAAS_MODEL,
    });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "method not allowed" });
  }

  if (!MAAS_API_KEY) {
    return json(503, { error: "云端引擎未配置 API Key" });
  }

  let messages;
  try {
    const body = JSON.parse(event.body || "{}");
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return json(400, { error: "messages 不能为空" });
    }
  } catch {
    return json(400, { error: "invalid json" });
  }

  // 只保留最近 8 条，单条截断 2000 字，避免被刷爆额度
  const history = messages.slice(-8).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content ?? "").slice(0, 2000),
  }));

  let upstream;
  try {
    upstream = await fetch(MAAS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAAS_API_KEY}`,
      },
      body: JSON.stringify({
        model: MAAS_MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });
  } catch (err) {
    return json(502, { error: `无法连接厂商接口：${err.message}` });
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return json(502, {
      error: `厂商接口返回 ${upstream.status}`,
      detail: detail.slice(0, 300),
    });
  }

  let data;
  try {
    data = await upstream.json();
  } catch {
    return json(502, { error: "厂商返回非 JSON" });
  }

  const choice = data?.choices?.[0]?.message ?? {};
  let reply = String(choice.content ?? "").trim();
  // DeepSeek-R1 这类推理模型可能只有 reasoning_content
  if (!reply && choice.reasoning_content) {
    reply = String(choice.reasoning_content).trim();
  }
  if (!reply) {
    return json(502, { error: "模型未返回内容" });
  }

  // 身份兜底：模型若自称“我是张柏慈”，强制改写
  reply = reply.replace(/我是张柏慈(?![创造训开部])/g, "我是由张柏慈训练并部署的AI助手");

  return json(200, { reply });
}
