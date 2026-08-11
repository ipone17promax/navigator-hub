// ============================================================
// 多语言翻译表 — 中/英文
// ============================================================

export type Locale = "zh" | "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  zh: "中文",
  en: "EN",
};

const zh = {
  // 通用
  loading: "正在连接安全通道…",
  backHome: "返回母港",
  notFound: "找不到对应的星际坐标",
  search: "搜索",
  close: "关闭",
  confirm: "确认",
  cancel: "取消",

  // 品牌区
  brandName: "星际导航中心",
  brandVersion: "星际导航中心 · v2.0",

  // 顶栏
  theme: "主题",
  admin: "管理员",
  superAdmin: "特级管理员",

  // 问候语
  greetingMorning: "早上好，欢迎回到导航中心",
  greetingNoon: "中午好，小憩之后继续奋战",
  greetingAfternoon: "下午好，保持专注高效",
  greetingEvening: "晚上好，别忘了劳逸结合",
  greetingNight: "夜深了，注意休息再出发",
  weekDays: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
  monthUnit: "月",
  dayUnit: "日",

  // 搜索
  searchPlaceholder: "输入关键词搜索站点，或直接搜索网页…",
  searchTip: "按 Enter 搜索，Tab 切换引擎",

  // 分类
  categories: {
    all: "全部",
    search: "搜索",
    dev: "开发",
    ai: "AI",
    design: "设计",
    social: "社交",
    video: "影音",
    learn: "学习",
    office: "办公",
    weather: "气象",
    tools: "工具",
  },

  // 站点网格
  siteCount: "共找到",
  sites: "个站点",
  categoryFiltering: "当前分类筛选中",
  rightClickTip: "右键 卡片可复制链接",
  noMatchTitle: "没有匹配的站点",
  noMatchDesc: "试试切换其他分类，或清空搜索关键词",

  // 收藏
  favorites: "收藏",
  favoritesTitle: "我的收藏",
  addFavorite: "收藏",
  removeFavorite: "取消收藏",
  noFavorites: "还没有收藏站点，点击卡片右上角星标即可收藏",

  // 底部导航
  quickNav: "快速导航",
  quickNavCount: "个",
  quickNavTip: "横向拖动可查看更多",
  swipeTip: "左右滑动切换分类",

  // 快捷工具
  quickTools: "快捷工具",
  toolNames: {
    translate: "翻译",
    calculator: "计算器",
    unitConvert: "单位换算",
    exchangeRate: "汇率",
    express: "快递",
    calendar: "日历",
    email: "邮箱",
    cloudDisk: "网盘",
  },

  // 统计面板
  statsTitle: "访问统计",
  statsTotalVisits: "总访问次数",
  statsTopSites: "最常访问",
  statsRecent: "最近访问",
  statsNoData: "暂无访问记录，点击站点卡片开始统计",
  statsClear: "清空统计",
  statsVisits: "次",
  statsLastVisit: "最后访问",

  // 背景设置
  bgTitle: "背景设置",
  bgDefault: "默认",
  bgCustom: "自定义",
  bgUpload: "上传图片",
  bgOpacity: "透明度",
  bgReset: "重置背景",
  bgPresetTitle: "预设背景",
  bgPresets: {
    stars: "星空",
    aurora: "极光",
    ocean: "深海",
    sunset: "日落",
    forest: "森林",
    abstract: "抽象",
  },

  // 页面加载
  pageLoading: "正在加载…",

  // 语言
  language: "语言",

  // 404
  hotSearch: "热门搜索",
  engineSwitch: "切换搜索引擎",
  footerTagline: "赛博未来主义网址导航中心",
  loadingChannel: "NavigatorHub · 安全通道",
  searchBtn: "搜索",
  favoritesCount: "个",
  notFoundCode: "404",
};

const en = {
  loading: "Connecting secure channel…",
  backHome: "Back to Hub",
  notFound: "Coordinates not found",
  search: "Search",
  close: "Close",
  confirm: "Confirm",
  cancel: "Cancel",

  brandName: "Navigator Hub",
  brandVersion: "Navigator Hub · v2.0",

  theme: "Theme",
  admin: "Admin",
  superAdmin: "Super Admin",

  greetingMorning: "Good morning, welcome back",
  greetingNoon: "Good noon, keep it up",
  greetingAfternoon: "Good afternoon, stay focused",
  greetingEvening: "Good evening, take a break",
  greetingNight: "Late night, rest well",
  weekDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  monthUnit: "",
  dayUnit: "",

  searchPlaceholder: "Search sites or the web…",
  searchTip: "Press Enter to search, Tab to switch engine",

  categories: {
    all: "All",
    search: "Search",
    dev: "Dev",
    ai: "AI",
    design: "Design",
    social: "Social",
    video: "Video",
    learn: "Learn",
    office: "Office",
    weather: "Weather",
    tools: "Tools",
  },

  siteCount: "Found",
  sites: "sites",
  categoryFiltering: "filtering by category",
  rightClickTip: "Right-click card to copy link",
  noMatchTitle: "No matching sites",
  noMatchDesc: "Try switching categories or clearing search",

  favorites: "Favorites",
  favoritesTitle: "My Favorites",
  addFavorite: "Favorite",
  removeFavorite: "Unfavorite",
  noFavorites: "No favorites yet. Click the star icon on any card to add.",

  quickNav: "Quick Nav",
  quickNavCount: "",
  quickNavTip: "Drag horizontally for more",
  swipeTip: "Swipe left/right to switch category",

  quickTools: "Quick Tools",
  toolNames: {
    translate: "Translate",
    calculator: "Calculator",
    unitConvert: "Convert",
    exchangeRate: "Rate",
    express: "Express",
    calendar: "Calendar",
    email: "Email",
    cloudDisk: "Cloud",
  },

  statsTitle: "Visit Stats",
  statsTotalVisits: "Total Visits",
  statsTopSites: "Top Sites",
  statsRecent: "Recent",
  statsNoData: "No visits yet. Click any site card to start tracking.",
  statsClear: "Clear Stats",
  statsVisits: "visits",
  statsLastVisit: "Last visit",

  bgTitle: "Background",
  bgDefault: "Default",
  bgCustom: "Custom",
  bgUpload: "Upload",
  bgOpacity: "Opacity",
  bgReset: "Reset",
  bgPresetTitle: "Presets",
  bgPresets: {
    stars: "Stars",
    aurora: "Aurora",
    ocean: "Ocean",
    sunset: "Sunset",
    forest: "Forest",
    abstract: "Abstract",
  },

  pageLoading: "Loading…",
  language: "Language",
    hotSearch: "Trending",
  engineSwitch: "Switch engine",
  footerTagline: "Cyber Navigation Hub",
  loadingChannel: "NavigatorHub · Secure Channel",
  searchBtn: "Search",
  favoritesCount: "",
  notFoundCode: "404",
};

export const translations = { zh, en } as const;
export type TranslationKeys = typeof zh;
