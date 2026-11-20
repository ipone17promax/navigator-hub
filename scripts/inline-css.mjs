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
fs.rmSync(cssPath, { force: true });
console.log("inlined", cssName, css.length, "bytes into index.html");