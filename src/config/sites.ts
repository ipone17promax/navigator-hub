import type { CategoryMeta, SiteCategory, SearchEngine, SiteItem } from "@/shared/types";

// ============================================================
// 1. 分类元数据（含全部）
// ============================================================
export const CATEGORIES: CategoryMeta[] = [
  { key: "all",    label: "全部",    icon: "✦",  accent: "#6366F1" },
  { key: "search", label: "搜索",    icon: "🔎", accent: "#38BDF8" },
  { key: "dev",    label: "开发",    icon: "💻", accent: "#A78BFA" },
  { key: "ai",     label: "AI",      icon: "🤖", accent: "#F472B6" },
  { key: "design", label: "设计",    icon: "🎨", accent: "#34D399" },
  { key: "social", label: "社交",    icon: "💬", accent: "#FBBF24" },
  { key: "video",  label: "影音",    icon: "🎬", accent: "#F87171" },
  { key: "learn",  label: "学习",    icon: "📚", accent: "#60A5FA" },
  { key: "office", label: "办公",    icon: "⚡", accent: "#22D3EE" },
  { key: "weather",label: "气象",    icon: "🌤️", accent: "#0EA5E9" },
  { key: "tools",  label: "工具",    icon: "🛠️", accent: "#EC4899" },
];

export const CATEGORY_MAP: Record<SiteCategory, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.key] = c;
    return acc;
  },
  {} as Record<SiteCategory, CategoryMeta>,
);

// ============================================================
// 2. 搜索引擎配置
// ============================================================
export const SEARCH_ENGINES: SearchEngine[] = [
  {
    id: "google",
    name: "Google",
    urlTemplate: "https://www.google.com/search?q={query}",
    iconName: "Search",
    accent: "#4285F4",
  },
  {
    id: "bing",
    name: "Bing",
    urlTemplate: "https://www.bing.com/search?q={query}",
    iconName: "Globe",
    accent: "#00809D",
  },
  {
    id: "baidu",
    name: "百度",
    urlTemplate: "https://www.baidu.com/s?wd={query}",
    iconName: "SearchCheck",
    accent: "#2932E1",
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo",
    urlTemplate: "https://duckduckgo.com/?q={query}",
    iconName: "ShieldCheck",
    accent: "#DE5833",
  },
];

// ============================================================
// 3. 站点数据（共 62 个，覆盖 8 大分类）
// ============================================================
export const SITES: SiteItem[] = [
  // ---------- 搜索引擎 search ----------
  { id: "s-google",  name: "Google",     description: "全球最大搜索引擎",  url: "https://www.google.com",  category: "search", iconName: "Search",       accent: "#4285F4" },
  { id: "s-bing",    name: "Bing",       description: "微软必应搜索",       url: "https://www.bing.com",    category: "search", iconName: "Globe",        accent: "#00809D" },
  { id: "s-baidu",   name: "百度",        description: "最大中文搜索引擎",   url: "https://www.baidu.com",   category: "search", iconName: "SearchCheck",  accent: "#2932E1" },
  { id: "s-ddg",     name: "DuckDuckGo", description: "注重隐私的搜索",     url: "https://duckduckgo.com",  category: "search", iconName: "ShieldCheck",  accent: "#DE5833" },

  // ---------- 开发工具 dev ----------
  { id: "d-github",   name: "GitHub",       description: "全球最大代码托管",   url: "https://github.com",          category: "dev", iconName: "Github",       accent: "#6E5494" },
  { id: "d-so",       name: "Stack Overflow", description: "程序员问答社区",   url: "https://stackoverflow.com",   category: "dev", iconName: "MessagesSquare", accent: "#F48024" },
  { id: "d-mdn",      name: "MDN",          description: "Web 开发权威文档",   url: "https://developer.mozilla.org",category: "dev", iconName: "BookOpen",     accent: "#000000" },
  { id: "d-npm",      name: "npm",          description: "Node 包管理仓库",    url: "https://www.npmjs.com",       category: "dev", iconName: "Package",      accent: "#CB3837" },
  { id: "d-codepen",  name: "CodePen",      description: "前端创意代码分享",   url: "https://codepen.io",          category: "dev", iconName: "PenTool",      accent: "#1E1F26" },
  { id: "d-vscode",   name: "VS Code Web",  description: "浏览器版 VS Code",   url: "https://vscode.dev",          category: "dev", iconName: "Code2",        accent: "#007ACC" },
  { id: "d-csb",      name: "CodeSandbox",  description: "在线 IDE 沙盒",      url: "https://codesandbox.io",      category: "dev", iconName: "Sandbox",      accent: "#000000" },
  { id: "d-gitlab",   name: "GitLab",       description: "DevOps 一体化平台",  url: "https://gitlab.com",          category: "dev", iconName: "GitBranch",    accent: "#FC6D26" },
  { id: "d-vercel",   name: "Vercel",       description: "前端部署最佳平台",   url: "https://vercel.com",          category: "dev", iconName: "Triangle",     accent: "#000000" },
  { id: "d-devdocs",  name: "DevDocs",      description: "多语言 API 文档速查",url: "https://devdocs.io",          category: "dev", iconName: "BookMarked",   accent: "#333333" },

  // ---------- AI 应用 ai ----------
  { id: "a-deepseek",  name: "DeepSeek",    description: "国产开源大模型",      url: "https://chat.deepseek.com",     category: "ai", iconName: "MessageCircle", accent: "#0066FF" },
  { id: "a-claude",    name: "Claude",        description: "Anthropic 长文 AI",    url: "https://claude.ai",               category: "ai", iconName: "Bot",           accent: "#D97757" },
  { id: "a-gemini",    name: "Gemini",        description: "Google 多模态 AI",     url: "https://gemini.google.com",       category: "ai", iconName: "Sparkles",      accent: "#4285F4" },
  { id: "a-mj",        name: "Midjourney",    description: "最强 AI 绘画工具",     url: "https://www.midjourney.com",      category: "ai", iconName: "Image",         accent: "#5865F2" },
  { id: "a-wx",        name: "通义万相",    description: "阿里 AI 图像生成",     url: "https://tongyi.aliyun.com/wanxiang", category: "ai", iconName: "Palette",       accent: "#625CFF" },
  { id: "a-perp",      name: "Perplexity",    description: "AI 智能搜索引擎",       url: "https://www.perplexity.ai",       category: "ai", iconName: "Compass",       accent: "#2288DD" },
  { id: "a-copilot",   name: "GitHub Copilot", description: "AI 结对编程助手",      url: "https://github.com/features/copilot", category: "ai", iconName: "BrainCircuit", accent: "#6E5494" },
  { id: "a-hf",        name: "Hugging Face",  description: "机器学习模型社区",     url: "https://huggingface.co",          category: "ai", iconName: "HeartPulse",    accent: "#FFD21E" },
  { id: "a-tyqw",      name: "通义千问",       description: "阿里大模型全家桶",     url: "https://tongyi.aliyun.com/qianwen",category: "ai", iconName: "Zap",           accent: "#625CFF" },
  { id: "a-wxyy",      name: "文心一言",       description: "百度 ERNIE 大模型",    url: "https://yiyan.baidu.com",         category: "ai", iconName: "Lightbulb",     accent: "#2932E1" },

  // ---------- 设计资源 design ----------
  { id: "ds-figma",    name: "Figma",              description: "协作式 UI 设计工具",  url: "https://www.figma.com",         category: "design", iconName: "Figma",        accent: "#F24E1E" },
  { id: "ds-dribbble", name: "Dribbble",           description: "设计师作品灵感社区",  url: "https://dribbble.com",          category: "design", iconName: "Dribbble",     accent: "#EA4C89" },
  { id: "ds-behance",  name: "Behance",            description: "Adobe 专业作品平台",  url: "https://www.behance.net",       category: "design", iconName: "Brush",        accent: "#1769FF" },
  { id: "ds-unsp",     name: "Unsplash",           description: "免费高清图库",         url: "https://unsplash.com",          category: "design", iconName: "ImagePlus",    accent: "#000000" },
  { id: "ds-pex",      name: "Pexels",             description: "免费素材站（图+视频）",url: "https://www.pexels.com",        category: "design", iconName: "Camera",       accent: "#05A081" },
  { id: "ds-icf",      name: "IconFont",           description: "阿里矢量图标库",       url: "https://www.iconfont.cn",       category: "design", iconName: "Smile",        accent: "#FF6A00" },
  { id: "ds-twc",      name: "Tailwind UI",        description: "Tailwind 官方组件",    url: "https://tailwindui.com",        category: "design", iconName: "LayoutGrid",   accent: "#38BDF8" },
  { id: "ds-framer",   name: "Framer",             description: "无代码交互原型",       url: "https://www.framer.com",        category: "design", iconName: "Layers",       accent: "#0055FF" },

  // ---------- 社交 social ----------
  { id: "so-x",        name: "X / Twitter",  description: "全球实时信息流",       url: "https://x.com",             category: "social", iconName: "Twitter",      accent: "#000000" },
  { id: "so-in",       name: "LinkedIn",     description: "全球职业社交网络",     url: "https://www.linkedin.com",  category: "social", iconName: "Linkedin",     accent: "#0A66C2" },
  { id: "so-wb",       name: "微博",          description: "中国最大社交媒体",     url: "https://weibo.com",         category: "social", iconName: "Hash",         accent: "#E6162D" },
  { id: "so-zh",       name: "知乎",          description: "中文问答社区",         url: "https://www.zhihu.com",     category: "social", iconName: "HelpCircle",   accent: "#0066FF" },
  { id: "so-db",       name: "豆瓣",          description: "书影音兴趣社区",       url: "https://www.douban.com",    category: "social", iconName: "BookText",     accent: "#2E9E62" },
  { id: "so-reddit",   name: "Reddit",       description: "全球兴趣论坛",         url: "https://www.reddit.com",    category: "social", iconName: "Snooze",       accent: "#FF4500" },
  { id: "so-bili",     name: "哔哩哔哩",       description: "年轻人的视频社区",     url: "https://www.bilibili.com",  category: "social", iconName: "Tv",           accent: "#FB7299" },
  { id: "so-yt",       name: "YouTube",      description: "全球最大视频平台",     url: "https://www.youtube.com",   category: "social", iconName: "Youtube",      accent: "#FF0000" },

  // ---------- 影音 video ----------
  { id: "v-netflix",   name: "Netflix",    description: "全球流媒体巨头",     url: "https://www.netflix.com",  category: "video", iconName: "Film",          accent: "#E50914" },
  { id: "v-disney",    name: "Disney+",    description: "迪士尼流媒体",       url: "https://www.disneyplus.com",category: "video", iconName: "Clapperboard", accent: "#113CCF" },
  { id: "v-iqiyi",     name: "爱奇艺",       description: "中文长视频平台",     url: "https://www.iqiyi.com",    category: "video", iconName: "PlayCircle",   accent: "#00BE06" },
  { id: "v-tencent",   name: "腾讯视频",     description: "腾讯长视频平台",     url: "https://v.qq.com",         category: "video", iconName: "PlaySquare",   accent: "#FF7A00" },
  { id: "v-youku",     name: "优酷",         description: "阿里大文娱长视频",   url: "https://www.youku.com",    category: "video", iconName: "Play",         accent: "#1677FF" },
  { id: "v-spotify",   name: "Spotify",    description: "全球最大音乐流媒体", url: "https://open.spotify.com", category: "video", iconName: "Music",        accent: "#1DB954" },

  // ---------- 学习 learn ----------
  { id: "l-bili-study",name: "B 站学习区",   description: "免费中文视频课",     url: "https://www.bilibili.com/v/knowledge/", category: "learn", iconName: "GraduationCap", accent: "#FB7299" },
  { id: "l-coursera",  name: "Coursera",     description: "全球名校在线课程",   url: "https://www.coursera.org",  category: "learn", iconName: "GraduationCap", accent: "#0056D2" },
  { id: "l-imooc",     name: "慕课网",        description: "中文 IT 技能学习",    url: "https://www.imooc.com",     category: "learn", iconName: "Laptop",       accent: "#2B85E5" },
  { id: "l-jike",      name: "极客时间",      description: "顶级技术专家专栏",   url: "https://time.geekbang.org", category: "learn", iconName: "Zap",          accent: "#0089FF" },
  { id: "l-juejin",    name: "掘金",          description: "开发者技术社区",     url: "https://juejin.cn",         category: "learn", iconName: "Pickaxe",      accent: "#1E80FF" },
  { id: "l-csdn",      name: "CSDN",          description: "中文技术博客平台",   url: "https://www.csdn.net",      category: "learn", iconName: "FileCode2",    accent: "#FC5531" },
  { id: "d-leetcode",  name: "LeetCode",      description: "算法题练习平台",     url: "https://leetcode.cn",       category: "learn", iconName: "Code",         accent: "#FFA116" },
  { id: "l-khan",      name: "可汗学院",      description: "全球免费教育",       url: "https://www.khanacademy.org",category: "learn", iconName: "School",       accent: "#14BF96" },

  // ---------- 办公效率 office ----------
  { id: "o-notion",    name: "Notion",       description: "全能知识协作 Wiki",   url: "https://www.notion.so",          category: "office", iconName: "NotebookPen", accent: "#000000" },
  { id: "o-feishu",    name: "飞书",         description: "字节跳动协作套件",     url: "https://www.feishu.cn",          category: "office", iconName: "Rocket",      accent: "#3370FF" },
  { id: "o-dingtalk",  name: "钉钉",         description: "阿里企业办公平台",     url: "https://www.dingtalk.com",       category: "office", iconName: "Bell",        accent: "#1677FF" },
  { id: "o-shimo",     name: "石墨文档",      description: "在线协作文档",         url: "https://shimo.im",               category: "office", iconName: "FileText",    accent: "#33D4B5" },
  { id: "o-tencent-doc",name:"腾讯文档",      description: "腾讯多人在线文档",     url: "https://docs.qq.com",            category: "office", iconName: "FileSpreadsheet", accent: "#1677FF" },
  { id: "o-yuque",     name: "语雀",         description: "阿里知识管理平台",     url: "https://www.yuque.com",          category: "office", iconName: "BookA",       accent: "#25B864" },
  { id: "o-todoist",   name: "Todoist",      description: "跨平台任务管理",       url: "https://todoist.com",            category: "office", iconName: "CheckSquare", accent: "#DB4C3F" },
  { id: "o-trello",    name: "Trello",       description: "看板式项目管理",       url: "https://trello.com",             category: "office", iconName: "LayoutList",  accent: "#0052CC" },

  // ---------- 气象灾害 weather ----------
  { id: "w-storm-tracker", name: "全球风暴实时预告",
    description: "🇺🇸 NOAA NHC 5日路径图 + 🇯🇵 JMA RSMC 东京台风中心 + 🌪️ Ventusky 全球热带气旋路径",
    url: "/storm-tracker",        // 内部 SPA 路由（React Router）
    category: "weather", iconName: "CloudLightning", accent: "#0284C7" },

  // ---------- 工具 tools ----------
  { id: "t-binary", name: "二进制解析器", description: "文字 ↔ 二进制 双向转换工具", url: "/binary-parser", category: "tools", iconName: "Binary", accent: "#EC4899" },
  { id: "t-morse", name: "摩斯电码机", description: "摩斯电码编码/解码器，支持音频播放", url: "/morse-code", category: "tools", iconName: "Radio", accent: "#8B5CF6" },
  { id: "t-compass", name: "罗盘时钟", description: "中国传统罗盘风格时钟，多层同心圆", url: "/compass-clock", category: "tools", iconName: "Compass", accent: "#F59E0B" },
];
