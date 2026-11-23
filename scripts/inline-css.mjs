import fs from "node:fs";
import path from "node:path";

/**
 * 构建后处理：把主 CSS 内联进 index.html
 * - 省掉一次 RTT，国内直连场景收益明显
 * - 前提：CSS 中没有相对路径的外链资源（已确认只有 data-uri）
 */
const htmlPath = path.resolve("dist/index.html");
let html = fs.readFileSync(htmlPath, "utf8");
const m = html.match(/<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/);
if (!m) {
  console.log("no stylesheet link found, skip css inline");
  process.exit(0);
}
const cssName = path.basename(m[1]);
const cssPath = path.join("dist", "assets", cssName);
const css = fs.readFileSync(cssPath, "utf8").replace(/<\/style/gi, "<\\/style");
html = html.replace(m[0], "<style>" + css + "</style>");
fs.writeFileSync(htmlPath, html);
// 保留 CSS 文件副本：浏览器缓存的旧版 index.html（CSS 仍为外链的版本）
// 引用的就是这个 hash 文件，删掉它会让所有旧缓存用户 404 白屏
console.log("inlined", cssName, css.length, "bytes into index.html (file kept)");
// 构建后处理：把主包 hash 注入 sw.js 的 BUILD_ID
// - 保证每次部署后 sw.js 内容必变，浏览器强制更新 Service Worker 与预缓存
// - 否则同一天内多次部署 sw.js 字节不变，SW 缓存的旧 index.html 会引用已删除的旧 CSS（404 白屏）
const mainJsMatch = html.match(/assets\/index-[A-Za-z0-9_-]+\.js/);
if (mainJsMatch) {
  const swPath = path.join("dist", "sw.js");
  const sw = fs.readFileSync(swPath, "utf8");
  const stamp = mainJsMatch[0].replace("assets/", "").replace(".js", "");
  if (sw.includes("__BUILD_ID__")) {
    fs.writeFileSync(swPath, sw.replace("__BUILD_ID__", stamp));
    console.log("sw.js BUILD_ID ->", stamp);
  }
}