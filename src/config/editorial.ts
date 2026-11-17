/**
 * 编辑精选：内容接口不可用时的静态兜底
 *
 * 原则：不伪造时效性新闻。只说「这些是常青内容」，
 * 让页面在断网 / 接口挂掉时依然有信息密度，而不是一片重试按钮。
 */

/** 今日快讯兜底：可验证、长期有效的实用提示 */
export const EDITORIAL_TIPS: string[] = [
  "DevTools → Network 勾选 Disable cache，调样式时不再被旧缓存误导",
  "地址栏输入 chrome://net-internals/#dns 可清空本机 DNS 缓存",
  "Ctrl+Shift+T 恢复刚关掉的标签页，连按可连续恢复",
  "网页按 F12 → Elements 选中元素后按 H 可临时隐藏，按 Delete 可删除节点",
  "长按链接（桌面端右键）复制地址，比手打域名更快也更安全",
  "在网址后加 ?utm_source=x 不会影响内容，只会给统计打标记",
  "npm i 前先看 package.json 的 engines 字段，能避开大部分版本坑",
  "Git 提交前跑一次 git diff --staged，比事后 review 便宜十倍",
  "CSS 用 color-mix() 做透明叠加，比写死 rgba 更适应主题切换",
  "任何「一键加速」都要先看它改了什么，再决定是否信任",
];

/** 热搜兜底：真实、稳定的站点入口（非新闻，不标时间） */
export const EDITORIAL_LINKS: { title: string; link: string }[] = [
  { title: "GitHub Trending · 今日热门仓库", link: "https://github.com/trending" },
  { title: "Hacker News · 技术圈讨论", link: "https://news.ycombinator.com" },
  { title: "MDN · Web 开发权威文档", link: "https://developer.mozilla.org/zh-CN" },
  { title: "V2EX · 创意工作者社区", link: "https://www.v2ex.com" },
  { title: "少数派 · 效率工具与技巧", link: "https://sspai.com" },
  { title: "阮一峰 · 科技爱好者周刊", link: "https://github.com/ruanyf/weekly" },
  { title: "Stack Overflow · 编程问答", link: "https://stackoverflow.com" },
  { title: "知乎热榜", link: "https://www.zhihu.com/hot" },
];
