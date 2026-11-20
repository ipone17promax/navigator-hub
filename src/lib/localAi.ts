import { SITES } from "@/config/sites";

/**
 * 本地 AI：优先连接 ai_server.py（Qwen2-0.5B + LoRA，127.0.0.1:7860）
 * 连接不上时回退到纯前端离线知识库，不访问任何云端 API
 */

const AI_BASE = "http://127.0.0.1:7860";

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiReply {
  text: string;
  links?: { label: string; url: string }[];
  action?: "elder" | "theme";
  source: "local-model" | "offline";
}

export interface ModelHealth {
  ok: boolean;
  loading?: boolean;
  model?: string;
  device?: string;
  adapter?: boolean;
}

function withTimeout(ms: number): { signal: AbortSignal; done: () => void } {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(t) };
}

export async function checkLocalModel(): Promise<ModelHealth> {
  const { signal, done } = withTimeout(1500);
  try {
    const r = await fetch(`${AI_BASE}/api/health`, { signal });
    if (!r.ok) return { ok: false };
    const j = (await r.json()) as ModelHealth;
    return { ...j, ok: !!j.ok };
  } catch {
    return { ok: false };
  } finally {
    done();
  }
}

export async function chatWithLocalModel(messages: AiMessage[]): Promise<string> {
  const { signal, done } = withTimeout(60000);
  try {
    const r = await fetch(`${AI_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal,
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || `HTTP ${r.status}`);
    }
    const j = (await r.json()) as { reply?: string };
    if (!j.reply) throw new Error("empty reply");
    return j.reply;
  } finally {
    done();
  }
}

function readWeather(): { city: string; temp: number; condition: string } | null {
  try {
    const raw = localStorage.getItem("nh.weather.data.v4");
    if (!raw) return null;
    const j = JSON.parse(raw) as { data?: { city?: string; temp?: number; condition?: string } };
    const d = j?.data;
    if (d && typeof d.temp === "number") {
      return { city: d.city || "", temp: d.temp, condition: d.condition || "" };
    }
  } catch {
    /* ignore */
  }
  return null;
}

const CATEGORY_WORDS: Record<string, string> = {
  ai: "ai",
  人工智能: "ai",
  大模型: "ai",
  dev: "dev",
  开发: "dev",
  编程: "dev",
  代码: "dev",
  design: "design",
  设计: "design",
  灵感: "design",
  learn: "study",
  study: "study",
  学习: "study",
  课程: "study",
  video: "video",
  视频: "video",
  影视: "video",
  office: "office",
  办公: "office",
  tools: "tools",
  工具: "tools",
  social: "social",
  社交: "social",
  weather: "weather",
  天气: "weather",
};

const TOOLS = [
  { keys: ["二维码", "qr"], label: "二维码生成器", url: "/qr-code" },
  { keys: ["json", "格式化"], label: "JSON 格式化", url: "/json-formatter" },
  { keys: ["摩斯", "morse", "电码"], label: "摩斯电码机", url: "/morse-code" },
  { keys: ["罗盘", "时钟", "clock", "指南针"], label: "罗盘时钟", url: "/compass-clock" },
  { keys: ["二进制", "binary", "解析"], label: "二进制解析器", url: "/binary-parser" },
  { keys: ["风暴", "飓风", "storm"], label: "全球风暴追踪", url: "/storm-tracker" },
];

function siteLinks(input: string): { label: string; url: string }[] {
  const q = input
    .replace(/^(打开|帮我打开|我想看|我想用|进入|去|搜一下|搜索)\s*/g, "")
    .replace(/(的)?(网站|官网|页面)$/g, "")
    .trim()
    .toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/).filter(Boolean);
  return SITES.filter((s) => {
    const hay = `${s.name} ${s.description} ${s.url}`.toLowerCase();
    return hay.includes(q) || words.every((w) => hay.includes(w));
  })
    .slice(0, 4)
    .map((s) => ({ label: s.name, url: s.url }));
}

function categoryLinks(input: string): { label: string; url: string }[] {
  const q = input.toLowerCase();
  const cat = Object.keys(CATEGORY_WORDS).find((k) => q.includes(k));
  if (!cat) return [];
  return SITES.filter((s) => s.category === CATEGORY_WORDS[cat])
    .slice(0, 5)
    .map((s) => ({ label: s.name, url: s.url }));
}

/** 离线知识库应答：覆盖导航站日常问题，无需网络 */
export function offlineReply(input: string, opts: { locale: "zh" | "en" }): AiReply {
  const zh = opts.locale === "zh";
  const q = input.trim().toLowerCase();

  if (/^(你好|您好|hi|hello|在吗|嗨)/.test(q)) {
    return {
      text: zh
        ? "你好，我在。我是导航站的本地 AI 助手，可以帮你找站点、打开工具、查天气、切换主题或开启老人模式。"
        : "Hi! I can find sites, open tools, check weather, switch themes or enable elder mode.",
      source: "offline",
    };
  }

  if (/你是谁|介绍.*自己|who are you|your name/.test(q)) {
    return {
      text: zh
        ? "我是 NavigatorHub 的本地 AI 助手。本机模型在线时使用 Qwen2-0.5B + LoRA 推理；离线时用内置知识库应答，不调用任何云端 API。"
        : "I'm NavigatorHub's local assistant. It uses a local Qwen2-0.5B + LoRA model when available, otherwise an offline knowledge base. No cloud API.",
      source: "offline",
    };
  }

  if (/天气|weather|气温|下雨|温度/.test(q)) {
    const w = readWeather();
    if (w) {
      return {
        text: zh
          ? `当前 ${w.city} ${w.temp}°C，${w.condition}。天气卡里可以点定位按钮重新定位，或点城市名手动设置。`
          : `${w.city}: ${w.temp}°C, ${w.condition}.`,
        source: "offline",
      };
    }
    return {
      text: zh ? "还没有天气数据。先回到首页天气卡，允许定位或手动输入城市。" : "No weather data yet. Allow location or set a city on the weather card.",
      source: "offline",
    };
  }

  if (/几点|时间|日期|今天.*号|time|date/.test(q)) {
    const now = new Date();
    return {
      text: now.toLocaleString(zh ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        weekday: "long",
      }),
      source: "offline",
    };
  }

  if (/老人|长辈|大字|字号|elder/.test(q)) {
    return {
      text: zh
        ? "正在切换老人模式。开启后整页放大，退出按钮固定在页面底部，随时可关。"
        : "Toggling elder mode. The exit button stays fixed at the bottom.",
      action: "elder",
      source: "offline",
    };
  }

  if (/主题|深色|浅色|暗色|theme|dark|light/.test(q)) {
    return { text: zh ? "已为你切换主题。" : "Theme switched.", action: "theme", source: "offline" };
  }

  if (/快捷键|快捷键|shortcut|键盘|command/.test(q)) {
    return {
      text: zh
        ? "常用快捷键：/ 聚焦搜索；Ctrl/Cmd+K 打开命令面板；1-9 打开收藏站点；L 切换语言；T 切换主题。"
        : "Shortcuts: / focus search; Ctrl/Cmd+K command palette; 1-9 open favorites; L language; T theme.",
      source: "offline",
    };
  }

  const tool = TOOLS.find((t) => t.keys.some((k) => q.includes(k)));
  if (tool) {
    return {
      text: zh ? `已找到「${tool.label}」，点下面的按钮直接打开。` : `Found ${tool.label}. Open it below.`,
      links: [{ label: tool.label, url: tool.url }],
      source: "offline",
    };
  }

  if (/搜索|search|查一下|找一下/.test(q)) {
    const kw = input.replace(/^(搜索|search|查一下|找一下)\s*/i, "").trim();
    return {
      text: kw
        ? zh
          ? `在顶部搜索框输入「${kw}」，按 Enter 即可用当前引擎搜索；输入站点名还会出现本地站点建议。`
          : `Type "${kw}" in the top search box and press Enter.`
        : zh
          ? "在顶部搜索框输入关键词即可；输入站点名会优先出现本地站点建议。"
          : "Use the top search box; site names show local suggestions.",
      source: "offline",
    };
  }

  const sites = siteLinks(input);
  if (sites.length) {
    return {
      text: zh ? "找到这些站点，点一下直接打开：" : "Found these sites:",
      links: sites,
      source: "offline",
    };
  }

  const cats = categoryLinks(input);
  if (cats.length) {
    return {
      text: zh ? "为你推荐这些站点：" : "Recommended sites:",
      links: cats,
      source: "offline",
    };
  }

  if (/帮助|能做什么|help|功能/.test(q)) {
    return {
      text: zh
        ? "我可以：找站点（“推荐 AI 网站”）、打开工具（“二维码”“JSON”）、查天气、看时间、切换主题、切换老人模式。也可以直接说“打开知乎”。"
        : "I can find sites, open tools, show weather/time, switch theme or elder mode.",
      source: "offline",
    };
  }

  return {
    text: zh
      ? "我是本地助手，暂时没听懂。可以试试：「推荐 AI 网站」「打开知乎」「今天天气」「二维码工具」「切换主题」「老人模式」。"
      : "I didn't catch that. Try: “AI sites”, “open Zhihu”, “weather”, “QR tool”, “theme”, “elder mode”.",
    source: "offline",
  };
}