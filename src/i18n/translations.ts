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
  cats: Record<string, string>;
  nav: { home: string; storm: string; binary: string; morse: string; clock: string };
  footer: { tip: string; slash: string; cmd: string; switch: string; copyright: string };
  bg: { title: string; presets: string; custom: string; opacity: string; upload: string; reset: string; chooseFile: string; starfield: string; aurora: string; deepsea: string; sunset: string; neon: string; cyber: string; minimal: string; sakura: string; warm: string; matrix: string; library: string; apply: string; downloading: string };
  fav: { title: string; empty: string; addHint: string };
  stats: { title: string; total: string; top: string; recent: string; visits: string; clear: string; noData: string };
  user: { menu: string; logout: string; login: string; guest: string; unlockPrivate: string; lockPrivate: string; guestHint: string };
  cmd: { title: string; placeholder: string; groups: { sites: string; cats: string; actions: string; tools: string }; empty: string; hint: string };
  sync: { title: string; export: string; import: string; copy: string; paste: string; reset: string; ok: string; fail: string; copied: string; confirmReset: string };
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
    nav: { home: "首页", storm: "雷暴", binary: "进制", morse: "摩斯", clock: "罗盘" },
    footer: { tip: "键盘快捷键", slash: "聚焦搜索", cmd: "命令面板", switch: "切换引擎", copyright: "本站收藏的精选网址导航" },
    bg: { title: "背景设置", presets: "预设渐变", custom: "自定义图片", opacity: "透明度", upload: "上传图片", reset: "重置背景", chooseFile: "选择一张图片",
      starfield: "星空", aurora: "极光", deepsea: "深海", sunset: "日落", neon: "霓虹", cyber: "赛博", minimal: "极简", sakura: "樱花", warm: "暖阳", matrix: "矩阵",
      library: "壁纸精选库", apply: "应用", downloading: "加载中…" },
    fav: { title: "我的收藏", empty: "还没有收藏，点站点右上角 ⭐ 即可收藏", addHint: "收藏" },
    stats: { title: "访问统计", total: "总访问次数", top: "最常访问", recent: "最近访问", visits: "次", clear: "清空统计", noData: "还没有数据，去逛逛吧～" },
    user: { menu: "用户", logout: "退出管理员", login: "管理员登录", guest: "访客模式", unlockPrivate: "解锁隐私分类", lockPrivate: "锁定隐私分类", guestHint: "访客看不到隐私分类和管理操作" },
    cmd: { title: "命令面板", placeholder: "输入命令、站点名、分类…  Esc 关闭", groups: { sites: "站点", cats: "分类", actions: "操作", tools: "工具页" }, empty: "没有匹配项，换个关键词试试？", hint: "上下移动  Enter 选择" },
    sync: { title: "数据同步", export: "导出 JSON", import: "导入 JSON", copy: "复制到剪贴板", paste: "粘贴 JSON 导入", reset: "清空所有数据", ok: "导入成功", fail: "导入失败，格式不对", copied: "已复制", confirmReset: "确定要清空所有收藏、统计、自定义数据吗？无法撤销。" },
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
  },
  en: {
    lang: "English",
    greeting: { morning: "Good morning", noon: "Good noon", afternoon: "Good afternoon", evening: "Good evening", night: "Good night" },
    week: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    today: "Today is",
    appName: "Navigator Hub",
    brandSub: "Search · Tools · Favorites",
    adminBadge: "Admin Mode",
    guestBadge: "Guest Mode",
    loading: "Warming up engines…",
    searchPlaceholder: "Type to search, or press / to focus…",
    engineSwitch: "Switch engine",
    searchBtn: "Search",
    hotSearch: "Hot",
    cats: { all: "All", dev: "Dev", design: "Design", study: "Study", life: "Life", ai: "AI", tools: "Tools", custom: "Custom", private: "Private" },
    nav: { home: "Home", storm: "Storm", binary: "Binary", morse: "Morse", clock: "Compass" },
    footer: { tip: "Keyboard", slash: "Focus", cmd: "Command palette", switch: "Switch engine", copyright: "A curated navigator for your daily workflow" },
    bg: { title: "Background", presets: "Presets", custom: "Custom image", opacity: "Opacity", upload: "Upload", reset: "Reset", chooseFile: "Pick an image",
      starfield: "Starfield", aurora: "Aurora", deepsea: "Deep Sea", sunset: "Sunset", neon: "Neon", cyber: "Cyber", minimal: "Minimal", sakura: "Sakura", warm: "Warm", matrix: "Matrix",
      library: "Wallpaper Library", apply: "Apply", downloading: "Loading…" },
    fav: { title: "Favorites", empty: "No favorites yet. Tap ⭐ on a site card.", addHint: "Favorite" },
    stats: { title: "Stats", total: "Total visits", top: "Most visited", recent: "Recently visited", visits: "visits", clear: "Clear", noData: "No data yet — start exploring!" },
    user: { menu: "User", logout: "Sign out", login: "Admin login", guest: "Guest mode", unlockPrivate: "Unlock private", lockPrivate: "Lock private", guestHint: "Guests can't see private categories" },
    cmd: { title: "Command Palette", placeholder: "Search sites, categories, actions…  Esc to close", groups: { sites: "Sites", cats: "Categories", actions: "Actions", tools: "Tool Pages" }, empty: "No matches. Try another keyword.", hint: "↑↓ navigate  Enter select" },
    sync: { title: "Data Sync", export: "Export JSON", import: "Import JSON", copy: "Copy", paste: "Paste JSON", reset: "Wipe all", ok: "Imported", fail: "Import failed: invalid JSON", copied: "Copied", confirmReset: "Clear ALL favorites, stats, custom data? This cannot be undone." },
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
  },
};

