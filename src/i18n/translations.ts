export type Locale = "zh" | "en";

export interface Dict {
  lang: string;
  greeting: { morning: string; noon: string; afternoon: string; evening: string; night: string };
  week: string[];
  months: string[];
  today: string;
  appName: string;
  brandSub: string;
  adminBadge: string;
  guestBadge: string;
  loading: string;
  searchPlaceholder: string;
  engineSwitch: string;
  searchBtn: string;
  hotSearch: string;
  search: { history: string; clear: string; urlHint: string; bangHint: string };
  searchTabs: {
    web: string; image: string; video: string; news: string; map: string; scholar: string;
    openNew: string; loading: string; keyword: string; resultsTitle: string; previewHint: string;
    opening: string; willOpen: string; goSearch: string; emptyTitle: string; emptyHint: string; tags: string[];
  };
  cats: Record<string, string>;
  nav: { home: string; storm: string; binary: string; morse: string; clock: string; qr: string; json: string };
  footer: { tip: string; slash: string; cmd: string; switch: string; copyright: string };
  bg: { title: string; presets: string; custom: string; opacity: string; upload: string; reset: string; chooseFile: string; starfield: string; aurora: string; deepsea: string; sunset: string; neon: string; cyber: string; minimal: string; sakura: string; warm: string; matrix: string; library: string; apply: string; downloading: string };
  fav: { title: string; empty: string; addHint: string };
  stats: { title: string; total: string; top: string; recent: string; visits: string; clear: string; noData: string };
  user: { menu: string; logout: string; login: string; guest: string; unlockPrivate: string; lockPrivate: string; guestHint: string };
  cmd: { title: string; placeholder: string; groups: { sites: string; cats: string; actions: string; tools: string }; empty: string; hint: string };
  sync: { title: string; export: string; import: string; copy: string; paste: string; reset: string; ok: string; fail: string; copied: string; confirmReset: string; share: string; shareHint: string; copyLink: string; importCode: string; tooLong: string; scanHint: string };
  gist: { title: string; hint: string; token: string; tokenPh: string; save: string; clear: string; upload: string; download: string; upOk: string; downOk: string; fail: string; noToken: string; idPh: string; open: string };
  custom: { title: string; addCat: string; addSite: string; edit: string; del: string; catName: string; catIcon: string; catPrivate: string; siteName: string; siteUrl: string; siteDesc: string; siteCat: string; save: string; cancel: string; confirmDel: string };
  layout: { title: string; comfy: string; compact: string; large: string; switch: string; dragHint: string };
  theme: { title: string; dark: string; light: string; system: string; accent: string; cyan: string; purple: string; pink: string; orange: string; green: string; mono: string };
  privacy: { setPwd: string; changePwd: string; oldPwd: string; newPwd: string; confirmPwd: string; empty: string; mismatch: string; wrong: string; pwdSet: string; unlocked: string; locked: string; noPwd: string };
  shortcut: { title: string; hint1: string; hint2: string; toggleCmd: string; focusSearch: string; switchLang: string; switchTheme: string };
  health: { title: string; ok: string; warn: string; err: string; unknown: string; check: string; checking: string; lastCheck: string };
  recommend: { title: string; freq: string; hint: string };
  notFound: string; notFoundCode: string; backHome: string; pageLoading: string;
  save: string; close: string; ok: string; cancel: string; yes: string; no: string; on: string; off: string;
  settings: string; wallpaper: string; language: string; data: string; layoutMode: string;
  // === 兼容旧组件字段 ===
  footerTagline: string;
  greetingMorning: string; greetingNoon: string; greetingAfternoon: string; greetingEvening: string; greetingNight: string;
  monthUnit: string; dayUnit: string; weekDays: string[];
  quickTools: string; toolNames: Record<string, string>;
  newtab: { title: string; step1: string; step2: string };
  // === 360 风格右侧信息栏 ===
  weather: {
    title: string; error: string; locating: string; locateFailed: string;
    setCity: string; cityPlaceholder: string; useGps: string; ipTag: string; manualTag: string;
  };
  stock: { title: string };
  news: { title: string };
  // === 公共短文案 ===
  common: { refresh: string; pause: string; play: string };
  // === 首屏引导 ===
  intro: { title: string; tagline: string; step1: string; step2: string; step3: string; dismiss: string };
  // === 内容中心 ===
  content: { flash: string; hot: string; hotFrom: string; quote: string; picks: string; retry: string; retryHint: string; empty: string; fallback: string; fallbackHint: string };
  // === 360 左侧栏 ===
  categories: { title: string; all: string; list: Record<string, string> };
  favorites: { title: string; empty: string };
  legal: { copyright: string; disclaimer: string };
}

export const dict: Record<Locale, Dict> = {
  zh: {
    lang: "中文",
    greeting: { morning: "早安", noon: "中午好", afternoon: "下午好", evening: "晚上好", night: "夜深了" },
    week: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
    months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    today: "今天是",
    appName: "导航中心",
    brandSub: "搜索 · 工具 · 收藏",
    adminBadge: "管理员模式",
    guestBadge: "访客模式",
    loading: "正在启动引擎…",
    searchPlaceholder: "输入关键词或按 / 聚焦搜索…",
    engineSwitch: "切换搜索引擎",
    searchBtn: "搜索",
    hotSearch: "热门搜索",
    search: { history: "最近搜索", clear: "清空", urlHint: "网址，回车直达", bangHint: "指定引擎" },
    searchTabs: {
      web: "网页", image: "图片", video: "视频", news: "资讯", map: "地图", scholar: "学术",
      openNew: "新标签打开",
      loading: "正在加载「{tab}」搜索结果…",
      keyword: "关键词",
      resultsTitle: "{tab}搜索结果",
      previewHint: "ⓘ 内嵌预览可能受网站 X-Frame-Options 限制，点击「新标签打开」可查看完整结果",
      opening: "即将打开{tab}搜索",
      willOpen: "关键词「{q}」将在新标签页中打开",
      goSearch: "前往{tab}搜索",
      emptyTitle: "{tab}搜索",
      emptyHint: "在上方搜索框输入关键词，即可在页面内预览「{tab}」结果",
      tags: ["React", "AI", "天气", "编程"],
    },
    cats: {
      all: "全部",
      dev: "开发工具",
      design: "设计灵感",
      study: "学习资料",
      life: "生活娱乐",
      ai: "AI 模型",
      tools: "实用工具",
      custom: "自定义",
      private: "隐私分类",
    },
    nav: { home: "首页", storm: "雷暴", binary: "进制", morse: "摩斯", clock: "罗盘", qr: "二维码", json: "JSON" },
    footer: { tip: "键盘快捷键", slash: "聚焦搜索", cmd: "命令面板", switch: "切换引擎", copyright: "本站收藏的精选网址导航" },
    bg: { title: "背景设置", presets: "预设渐变", custom: "自定义图片", opacity: "透明度", upload: "上传图片", reset: "重置背景", chooseFile: "选择一张图片",
      starfield: "星空", aurora: "极光", deepsea: "深海", sunset: "日落", neon: "霓虹", cyber: "赛博", minimal: "极简", sakura: "樱花", warm: "暖阳", matrix: "矩阵",
      library: "壁纸精选库", apply: "应用", downloading: "加载中…" },
    fav: { title: "我的收藏", empty: "还没有收藏，点站点右上角 ⭐ 即可收藏", addHint: "收藏" },
    stats: { title: "访问统计", total: "总访问次数", top: "最常访问", recent: "最近访问", visits: "次", clear: "清空统计", noData: "还没有数据，去逛逛吧～" },
    user: { menu: "用户", logout: "退出管理员", login: "管理员登录", guest: "访客模式", unlockPrivate: "解锁隐私分类", lockPrivate: "锁定隐私分类", guestHint: "访客看不到隐私分类和管理操作" },
    cmd: { title: "命令面板", placeholder: "输入命令、站点名、分类…  Esc 关闭", groups: { sites: "站点", cats: "分类", actions: "操作", tools: "工具页" }, empty: "没有匹配项，换个关键词试试？", hint: "上下移动  Enter 选择" },
    sync: { title: "数据同步", export: "导出 JSON", import: "导入 JSON", copy: "复制到剪贴板", paste: "粘贴 JSON 导入", reset: "清空所有数据", ok: "导入成功", fail: "导入失败，格式不对", copied: "已复制", confirmReset: "确定要清空所有收藏、统计、自定义数据吗？无法撤销。", share: "生成同步二维码", shareHint: "手机扫码即可带走收藏、自定义站点与布局。二维码在本机生成，不经过任何服务器，也不会上传数据。", copyLink: "复制同步链接", importCode: "导入同步码 / 链接", tooLong: "数据较多，二维码可能扫不出来，建议用复制的链接", scanHint: "用手机相机或浏览器扫码打开，确认后即可导入" },
    gist: { title: "云同步（GitHub Gist）", hint: "用你自己的 GitHub 令牌，把数据存进你名下的私密 Gist，换设备粘贴同一个 Gist ID 即可恢复。令牌只留在本机，不会上传。", token: "GitHub Token", tokenPh: "粘贴 gist 权限的 Personal Access Token", save: "保存令牌", clear: "清除令牌", upload: "上传到云端", download: "从云端恢复", upOk: "已上传到你的私密 Gist", downOk: "已从云端恢复", fail: "操作失败", noToken: "请先填写并保存 GitHub Token", idPh: "Gist ID（可留空，自动使用本机上次记录）", open: "打开 Gist" },
    custom: { title: "自定义管理", addCat: "新增分类", addSite: "新增站点", edit: "编辑", del: "删除", catName: "分类名称", catIcon: "图标 (lucide name)", catPrivate: "设为隐私分类", siteName: "站点名称", siteUrl: "网址", siteDesc: "一句话介绍", siteCat: "所属分类", save: "保存", cancel: "取消", confirmDel: "确定删除吗？" },
    layout: { title: "布局", comfy: "宽松", compact: "密集", large: "大卡片", switch: "切换布局", dragHint: "按住拖动可排序" },
    theme: { title: "主题配色", dark: "深色", light: "浅色", system: "跟随系统", accent: "强调色", cyan: "赛博青", purple: "霓虹紫", pink: "樱花粉", orange: "暖阳橙", green: "森林绿", mono: "极简灰" },
    privacy: { setPwd: "设置隐私密码", changePwd: "修改隐私密码", oldPwd: "旧密码", newPwd: "新密码", confirmPwd: "确认密码", empty: "请输入密码", mismatch: "两次密码不一致", wrong: "密码错误", pwdSet: "密码已设置", unlocked: "隐私分类已解锁", locked: "隐私分类已锁定", noPwd: "还没有设置隐私密码，先设置一个吧" },
    shortcut: { title: "快捷键", hint1: "数字键", hint2: "直接打开对应站点（当前分类）", toggleCmd: "命令面板", focusSearch: "聚焦搜索", switchLang: "切换语言", switchTheme: "切换明暗" },
    health: { title: "站点健康", ok: "在线", warn: "超时", err: "无法访问", unknown: "未检测", check: "开始检测", checking: "检测中…", lastCheck: "最近检测" },
    recommend: { title: "为你推荐", freq: "高频访问", hint: "根据你的访问记录推荐" },
    notFound: "找不到这个页面", notFoundCode: "404", backHome: "返回首页", pageLoading: "页面加载中…",
    save: "保存", close: "关闭", ok: "确定", cancel: "取消", yes: "是", no: "否", on: "开", off: "关",
    settings: "设置", wallpaper: "壁纸", language: "语言", data: "数据", layoutMode: "布局模式",
    footerTagline: "本站收藏的精选网址导航",
    greetingMorning: "早安", greetingNoon: "中午好", greetingAfternoon: "下午好", greetingEvening: "晚上好", greetingNight: "夜深了",
    monthUnit: "年", dayUnit: "月", weekDays: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
    quickTools: "快捷工具", toolNames: { storm: "雷暴追踪", binary: "进制转换", morse: "摩斯电码", compass: "罗盘时钟" },
    newtab: { title: "设为新标签页", step1: "1. 复制上面的地址", step2: "2. Chrome / Edge 设置 → 启动时 → 打开特定网页 → 粘贴" },
    weather: {
      title: "实时天气", error: "天气获取失败，请检查网络后重试",
      locating: "正在获取你的位置…", locateFailed: "无法获取你的位置",
      setCity: "手动设置城市", cityPlaceholder: "输入城市名，如 哈尔滨", useGps: "重新定位",
      ipTag: "IP 定位", manualTag: "手动",
    },
    stock: { title: "股市行情" },
    news: { title: "新闻速递" },
    common: { refresh: "刷新", pause: "暂停", play: "继续" },
    intro: {
      title: "30 秒看懂",
      tagline: "把搜索、常用网站、A 股行情、新闻和 4 个小工具收进一屏，打开就能用，不用再翻收藏夹。",
      step1: "顶部输入关键词，或按 / 直接聚焦搜索框",
      step2: "下方切分类、点卡片直达站点，⭐ 收藏到顶部",
      step3: "底部信息条看行情与新闻，快捷工具进入小工具页",
      dismiss: "知道了",
    },
    content: {
      flash: "今日快讯",
      hot: "微博热搜",
      hotFrom: "数据：微博",
      quote: "每日一句",
      picks: "今日推荐",
      retry: "重试",
      retryHint: "内容暂时获取失败，可稍后重试",
      empty: "暂无内容",
      fallback: "离线精选",
      fallbackHint: "实时接口暂时不可用，先看看这些常青内容",
    },
    categories: { title: "网站分类", all: "全部网站", list: { all: "全部", dev: "开发", design: "设计", study: "学习", life: "生活", ai: "AI", tools: "工具", social: "社交", video: "影音", office: "办公", weather: "气象", search: "搜索" } },
    favorites: { title: "我的收藏", empty: "还没有收藏，点站点卡片 ⭐ 收藏" },
    legal: {
      copyright: "© 2026 张柏慈 · Navigator Hub 保留所有权利。未经书面授权，禁止复制、镜像、二次分发或用于商业用途。",
      disclaimer: "本站仅提供网址索引与跳转，不存储、不代理任何第三方网站内容；各站点名称、图标及商标归其权利人所有。如权利人认为内容侵权，请通过 GitHub 联系作者删除。",
    },
  },
  en: {
    lang: "English",
    greeting: { morning: "Good morning", noon: "Good noon", afternoon: "Good afternoon", evening: "Good evening", night: "Good night" },
    week: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    today: "Today is",
    appName: "Star Navigation Center",
    brandSub: "Search · Tools · Favorites",
    adminBadge: "Admin Mode",
    guestBadge: "Guest Mode",
    loading: "Warming up engines…",
    searchPlaceholder: "Type to search, or press / to focus…",
    engineSwitch: "Switch engine",
    searchBtn: "Search",
    hotSearch: "Hot",
    search: { history: "Recent", clear: "Clear", urlHint: "URL — Enter to open", bangHint: "Engine" },
    searchTabs: {
      web: "Web", image: "Images", video: "Videos", news: "News", map: "Maps", scholar: "Scholar",
      openNew: "Open in new tab",
      loading: "Loading {tab} results…",
      keyword: "Keyword",
      resultsTitle: "{tab} results",
      previewHint: "ⓘ Inline preview may be blocked by X-Frame-Options. Use “Open in new tab” for full results.",
      opening: "Opening {tab} search",
      willOpen: "Keyword “{q}” will open in a new tab",
      goSearch: "Search with {tab}",
      emptyTitle: "{tab} Search",
      emptyHint: "Type a keyword above to preview {tab} results here",
      tags: ["React", "AI", "Weather", "Coding"],
    },
    cats: { all: "All", dev: "Dev", design: "Design", study: "Study", life: "Life", ai: "AI", tools: "Tools", custom: "Custom", private: "Private" },
    nav: { home: "Home", storm: "Storm", binary: "Binary", morse: "Morse", clock: "Compass", qr: "QR", json: "JSON" },
    footer: { tip: "Keyboard", slash: "Focus", cmd: "Command palette", switch: "Switch engine", copyright: "A curated navigator for your daily workflow" },
    bg: { title: "Background", presets: "Presets", custom: "Custom image", opacity: "Opacity", upload: "Upload", reset: "Reset", chooseFile: "Pick an image",
      starfield: "Starfield", aurora: "Aurora", deepsea: "Deep Sea", sunset: "Sunset", neon: "Neon", cyber: "Cyber", minimal: "Minimal", sakura: "Sakura", warm: "Warm", matrix: "Matrix",
      library: "Wallpaper Library", apply: "Apply", downloading: "Loading…" },
    fav: { title: "Favorites", empty: "No favorites yet. Tap ⭐ on a site card.", addHint: "Favorite" },
    stats: { title: "Stats", total: "Total visits", top: "Most visited", recent: "Recently visited", visits: "visits", clear: "Clear", noData: "No data yet — start exploring!" },
    user: { menu: "User", logout: "Sign out", login: "Admin login", guest: "Guest mode", unlockPrivate: "Unlock private", lockPrivate: "Lock private", guestHint: "Guests can't see private categories" },
    cmd: { title: "Command Palette", placeholder: "Search sites, categories, actions…  Esc to close", groups: { sites: "Sites", cats: "Categories", actions: "Actions", tools: "Tool Pages" }, empty: "No matches. Try another keyword.", hint: "↑↓ navigate  Enter select" },
    sync: { title: "Data Sync", export: "Export JSON", import: "Import JSON", copy: "Copy", paste: "Paste JSON", reset: "Wipe all", ok: "Imported", fail: "Import failed: invalid JSON", copied: "Copied", confirmReset: "Clear ALL favorites, stats, custom data? This cannot be undone.", share: "Create sync QR", shareHint: "Scan to carry favorites, custom sites and layout to your phone. The QR is generated locally — no server, no upload.", copyLink: "Copy sync link", importCode: "Import sync code / link", tooLong: "Payload is large; the QR may not scan. Use the copied link instead.", scanHint: "Scan with your phone camera or browser, then confirm to import" },
    gist: { title: "Cloud Sync (GitHub Gist)", hint: "Use your own GitHub token to store data in a private Gist under your account. Paste the same Gist ID on another device to restore. The token stays on this device and is never uploaded.", token: "GitHub Token", tokenPh: "Paste a Personal Access Token with gist scope", save: "Save token", clear: "Clear token", upload: "Upload to cloud", download: "Restore from cloud", upOk: "Uploaded to your private Gist", downOk: "Restored from cloud", fail: "Operation failed", noToken: "Save a GitHub Token first", idPh: "Gist ID (leave empty to use the last one on this device)", open: "Open Gist" },
    custom: { title: "Customize", addCat: "New category", addSite: "New site", edit: "Edit", del: "Delete", catName: "Category name", catIcon: "Icon (lucide name)", catPrivate: "Mark as private", siteName: "Site name", siteUrl: "URL", siteDesc: "Short description", siteCat: "Category", save: "Save", cancel: "Cancel", confirmDel: "Delete?" },
    layout: { title: "Layout", comfy: "Comfy", compact: "Compact", large: "Large", switch: "Toggle layout", dragHint: "Drag to reorder" },
    theme: { title: "Theme", dark: "Dark", light: "Light", system: "System", accent: "Accent", cyan: "Cyber Cyan", purple: "Neon Purple", pink: "Sakura", orange: "Warm", green: "Forest", mono: "Mono" },
    privacy: { setPwd: "Set privacy password", changePwd: "Change password", oldPwd: "Old password", newPwd: "New password", confirmPwd: "Confirm", empty: "Enter password", mismatch: "Passwords mismatch", wrong: "Wrong password", pwdSet: "Password set", unlocked: "Private unlocked", locked: "Private locked", noPwd: "Set a privacy password first" },
    shortcut: { title: "Shortcuts", hint1: "Number keys", hint2: "Open site in current category", toggleCmd: "Command palette", focusSearch: "Focus search", switchLang: "Toggle language", switchTheme: "Toggle appearance" },
    health: { title: "Site Health", ok: "Online", warn: "Slow", err: "Offline", unknown: "Untested", check: "Run check", checking: "Checking…", lastCheck: "Last check" },
    recommend: { title: "For you", freq: "Frequent", hint: "Based on your history" },
    notFound: "This page wandered off", notFoundCode: "404", backHome: "Go home", pageLoading: "Loading page…",
    save: "Save", close: "Close", ok: "OK", cancel: "Cancel", yes: "Yes", no: "No", on: "On", off: "Off",
    settings: "Settings", wallpaper: "Wallpaper", language: "Language", data: "Data", layoutMode: "Layout",
    footerTagline: "A curated navigator for your daily workflow",
    greetingMorning: "Good morning", greetingNoon: "Good noon", greetingAfternoon: "Good afternoon", greetingEvening: "Good evening", greetingNight: "Good night",
    monthUnit: "/", dayUnit: "/", weekDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    quickTools: "Quick Tools", toolNames: { storm: "Storm Tracker", binary: "Binary Parser", morse: "Morse Code", compass: "Compass Clock" },
    newtab: { title: "Use as New Tab", step1: "1. Copy the URL above", step2: "2. In Chrome/Edge Settings → On startup → Open specific page → Paste" },
    weather: {
      title: "Weather", error: "Weather unavailable. Check your connection and retry.",
      locating: "Locating…", locateFailed: "Couldn't get your location",
      setCity: "Set city", cityPlaceholder: "City name, e.g. Harbin", useGps: "Locate me",
      ipTag: "IP", manualTag: "Manual",
    },
    stock: { title: "Stock Market" },
    news: { title: "News Stream" },
    common: { refresh: "Refresh", pause: "Pause", play: "Resume" },
    intro: {
      title: "In 30 seconds",
      tagline: "Search, bookmarks, A-share quotes, news and 4 mini tools on one screen. Open and use, no bookmark digging.",
      step1: "Type a keyword up top, or press / to focus search",
      step2: "Switch categories below and tap a card to open a site; ⭐ saves it to the top",
      step3: "The bottom strip shows quotes and news; Quick Tools opens the utility pages",
      dismiss: "Got it",
    },
    content: {
      flash: "Today's Brief",
      hot: "Weibo Trends",
      hotFrom: "via Weibo",
      quote: "Daily Quote",
      picks: "Today's Picks",
      retry: "Retry",
      retryHint: "Content temporarily unavailable. Try again later.",
      empty: "No content yet",
      fallback: "Offline picks",
      fallbackHint: "Live feeds are unavailable — here are some evergreen reads",
    },
    categories: { title: "Categories", all: "All Sites", list: { all: "All", dev: "Dev", design: "Design", study: "Study", life: "Life", ai: "AI", tools: "Tools", social: "Social", video: "Video", office: "Office", weather: "Weather", search: "Search" } },
    favorites: { title: "Favorites", empty: "No favorites yet. Tap ⭐ on a site card." },
    legal: {
      copyright: "© 2026 Zhang Baici · Navigator Hub. All rights reserved. Unauthorized copying, mirroring, redistribution or commercial use is prohibited.",
      disclaimer: "This site only indexes and links to third-party websites; it does not host or proxy their content. All site names, icons and trademarks belong to their respective owners. Rights holders may contact the author for removal.",
    },
  },
};

