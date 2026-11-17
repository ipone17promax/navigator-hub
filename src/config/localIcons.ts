/**
 * 本地图标白名单
 *
 * 放在 public/icons/ 下的图标（如 github.svg）需要在这里登记文件名（不含扩展名）。
 * 为什么：站点卡片原先每个站点都会先试 /icons/{id}.svg 与 /icons/{id}.png，
 * 目录为空时等于每次进首页白打 120+ 个 404，控制台一片红、还拖慢首屏。
 * 现在只有登记过的 id 才会走本地探测，其余直接请求在线 favicon 源。
 *
 * 例：public/icons/github.svg → 这里写 "github"
 */
export const LOCAL_ICON_IDS: readonly string[] = [];
