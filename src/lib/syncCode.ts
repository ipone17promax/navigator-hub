/**
 * 跨端同步码：纯前端压缩编码，不经过任何服务器
 *   - 有 CompressionStream 时用 gzip，否则退化为 base64
 *   - 前缀 g / r 表示编码方式，便于解码时判断
 */

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b + "=".repeat((4 - (b.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encodeSync(data: unknown): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(data));
  if (typeof CompressionStream !== "undefined") {
    const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream("gzip"));
    const buf = new Uint8Array(await new Response(stream).arrayBuffer());
    return "g" + toBase64Url(buf);
  }
  return "r" + toBase64Url(raw);
}

export async function decodeSync(code: string): Promise<unknown> {
  const kind = code.charAt(0);
  const bytes = fromBase64Url(code.slice(1));
  if (kind === "g") {
    if (typeof DecompressionStream === "undefined") throw new Error("当前浏览器不支持解压此同步码");
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    const buf = await new Response(stream).arrayBuffer();
    return JSON.parse(new TextDecoder().decode(buf));
  }
  if (kind === "r") return JSON.parse(new TextDecoder().decode(bytes));
  throw new Error("同步码格式不正确");
}

/** 从完整链接或裸同步码中取出同步码部分 */
export function extractSyncCode(input: string): string {
  const m = input.trim().match(/[?&]sync=([^&#\s]+)/);
  return m ? decodeURIComponent(m[1]) : input.trim();
}
