/**
 * GitHub Gist 云同步
 *
 * 设计取舍：
 * - 不经过任何自建服务器，用户自带 Personal Access Token（只需 gist 权限），
 *   数据直接写入用户自己的私密 Gist，作者零成本、用户零信任风险。
 * - token 只存在本机 localStorage，可随时一键清除；不会随同步数据一起上传。
 * - api.github.com 支持跨域，纯前端即可完成。
 */

const TOKEN_KEY = "nh.gist.token";
const ID_KEY = "nh.gist.id";
const FILE_NAME = "navigator-hub.json";

export interface GistPayload {
  v: number;
  favorites: string[];
  favoriteOrder: string[];
  visits: unknown[];
  customCats: unknown[];
  customSites: unknown[];
  categoryOrder: string[];
  layout: string;
  privatePwdHash: string;
  health: Record<string, unknown>;
}

export function getGistToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setGistToken(token: string) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function getGistId(): string {
  try {
    return localStorage.getItem(ID_KEY) || "";
  } catch {
    return "";
  }
}

export function setGistId(id: string) {
  try {
    if (id) localStorage.setItem(ID_KEY, id);
    else localStorage.removeItem(ID_KEY);
  } catch {
    /* ignore */
  }
}

/* ---------- 同步快照：上传/下载前自动备份，可一键回滚 ---------- */
const SNAPSHOT_KEY = "nh.gist.snapshot.v1";

export interface GistSnapshot {
  at: number;
  reason: "before-upload" | "before-download";
  payload: unknown;
}

export function saveSnapshot(payload: unknown, reason: GistSnapshot["reason"]): void {
  try {
    localStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify({ at: Date.now(), reason, payload } satisfies GistSnapshot),
    );
  } catch {
    /* ignore */
  }
}

export function getSnapshot(): GistSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GistSnapshot;
    if (s && s.at && s.payload) return s;
  } catch {
    /* ignore */
  }
  return null;
}

export function clearSnapshot(): void {
  try {
    localStorage.removeItem(SNAPSHOT_KEY);
  } catch {
    /* ignore */
  }
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

async function assertOk(res: Response) {
  if (res.ok) return;
  let detail = "";
  try {
    const body = await res.json();
    detail = body?.message ? `: ${body.message}` : "";
  } catch {
    /* ignore */
  }
  throw new Error(`HTTP ${res.status}${detail}`);
}

/** 上传（有 gist id 则更新，否则新建私密 Gist） */
export async function uploadToGist(token: string, payload: unknown): Promise<{ id: string; url: string }> {
  const body = JSON.stringify({
    description: "Navigator Hub · 跨端同步（自动生成）",
    public: false,
    files: { [FILE_NAME]: { content: JSON.stringify(payload, null, 2) } },
  });
  const id = getGistId();
  const res = id
    ? await fetch(`https://api.github.com/gists/${id}`, { method: "PATCH", headers: headers(token), body })
    : await fetch("https://api.github.com/gists", { method: "POST", headers: headers(token), body });
  await assertOk(res);
  const data = await res.json();
  const gistId = String(data.id || id);
  setGistId(gistId);
  return { id: gistId, url: String(data.html_url || `https://gist.github.com/${gistId}`) };
}

/** 下载并解析同步内容（私密 Gist 需要 token；公开的可不填） */
export async function downloadFromGist(id: string, token: string): Promise<unknown> {
  const gid = id.trim() || getGistId();
  if (!gid) throw new Error("missing gist id");
  const h: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com/gists/${gid}`, { headers: h });
  await assertOk(res);
  const data = await res.json();
  const file = data?.files?.[FILE_NAME] ?? Object.values(data?.files ?? {})[0] as { content?: string; truncated?: boolean; raw_url?: string } | undefined;
  if (!file) throw new Error("file not found in gist");
  let content = file.content;
  if ((!content || file.truncated) && file.raw_url) {
    const raw = await fetch(file.raw_url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    await assertOk(raw);
    content = await raw.text();
  }
  if (!content) throw new Error("empty gist content");
  return JSON.parse(content);
}
