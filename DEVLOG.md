# AINEWS 开发日志

## Session 1 · 修复每日抓取 + 扩充来源

### 问题：文章停更在 Mar 20，无法每日自动更新
- **根本原因**：`/api/cron/route.ts` 里 `fetchAll()` 没有加 `await`，Vercel 函数在 `return` 时就退出了，抓取任务从未真正执行
- **修复**：改为 `await fetchAll()`，同时添加 `export const maxDuration = 60`（Hobby plan 上限）

### 问题：来源页面只显示 27 个，实际应有 40 个
- Footer 硬编码 "27 sources" → 改为 "40 sources"
- 来源页面只显示 ok/error 计数 → 新增 `{sources.length} total` 徽章

### 问题：13 个来源从未被抓取（状态一直是 pending）
- 原因：这些 source 在数据库里有对应 slug，但 `FETCHER_MAP` 里没有注册
- 补充了以下 source 到 `fetchers/index.ts`：
  - Tool 分类：`venturebeat`、`aibusiness`、`arstechnica`
  - Design 分类：`design-milk`、`creativebloq`、`colossal`、`designboom`、`dezeen`、`thedieline`
  - UX/UI 分类：`uxdesignweekly`
  - Tech 分类：`openai`、`towardsdatascience`、`thegradient`

### 问题：RSS fetcher 遇到慢速站点会无限挂起
- `fetchers/rss/generic.ts` 新增 `requestOptions: { timeout: 15000 }`

### 替换 3 个损坏的来源
| 旧来源 | 原因 | 新来源 |
|--------|------|--------|
| Reddit r/artificial | 服务器返回 403 | AI News (artificialintelligence-news.com) |
| Bootcamp | RSS 格式错误 | UX Design Weekly |
| Papers with Code | RSS 格式错误 | The Gradient |

---

## Session 2 · 自定义图标 + Logo + Load More 按钮

### 替换导航图标
- 原方案：图标库（lucide / heroicons）
- 新方案：用户提供的 5 个贴纸风格 SVG，存放于 `/public/icons/`
- `Header.tsx` 改用 Next.js `<Image>` 组件加载，支持每个图标独立尺寸
- 去除选中时的黑色背景，改为 `group-hover:scale-125` hover 放大效果

最终各图标尺寸（经过多次微调）：

| 图标 | 文件 | 尺寸 |
|------|------|------|
| Pick | pick.svg | 32px |
| Tool | tool.svg | 36px |
| Visual | visual.svg | 36px |
| UX/UI | uxui.svg | 38px |
| Tech | tech.svg | 38px |

### 替换 Logo
- 原：文字 "AI NEWS"
- 新：用户提供的 AINEWS 贴纸风格 SVG (`/public/icons/logo.svg`)
- 显示尺寸经过调整：120px → 160px → 200px → **178px**（最终确认）

### 替换 Load More 按钮
- 原：普通文字按钮
- 新：贴纸风格胶囊形 SVG 按钮 (`/public/icons/load-more.svg`)
- 添加 `hover:scale-105` 悬停效果，loading 状态保留旋转动画

---

## Session 3 · 卡片样式优化

### 文字增大加粗
- 标题：`text-lg font-semibold` → `text-xl font-bold`
- 描述：`text-xs` → `text-sm`（后调整为 `text-[13px]`）
- 来源 / 日期：`text-xs` → `text-sm font-semibold`

### 纯色卡片白色文字加粗
- 描述：加 `font-medium`，透明度 `white/70` → `white/90`
- 来源名称：`font-semibold` → `font-bold`，透明度 `white/60` → `white/80`
- 日期：加 `font-medium`，透明度 `white/40` → `white/60`

### 摘要按句子截断
- 原：`line-clamp-2`（视觉截断，可能截断半句话）
- 新：`trimDesc()` 函数，按 `.!?` 分句，保留累计不超过 100 字符的完整句子，末尾补 `…`

### 浅色卡片自适应文字颜色
- `lib/colors.ts` 新增 `isLightColor()` 函数，用感知亮度公式计算
- 阈值 `luminance > 0.75` 判定为浅色（只有明黄 `#FFE066` 触发）
- 浅色背景 → 描述 `gray-500`、来源 `gray-500`、日期 `gray-400`
- 深色 / 绿色背景 → 保持白色

---

## Session 4 · 修复 Tech 分类 + Cron 拆分

### 问题：Tech 分类默认只显示 2 列
- **根本原因 1**：Vercel Hobby plan 60 秒限制，40 个 source 顺序抓取超时，Tech 的 source 排在列表靠后，每次都被 kill 掉，DB 里几乎没有 Tech 文章
- **根本原因 2**：`MAX_PER_SOURCE = 4`，即使 DB 有数据，单一来源最多展示 4 篇
- **修复**：本地运行 `npx tsx --env-file=.env.local scripts/fetch-all.ts` 手动补全所有 source，`MAX_PER_SOURCE` 调整为 5

### Cron 拆分为 4 个分类任务
将单个 `/api/cron` 拆分为 4 个独立路由，每个只抓对应分类的 source（约 10-14 个，30-50 秒内完成）：

| 路由 | 分类 | 触发时间（UTC）| 北京时间 |
|------|------|--------------|---------|
| `/api/cron/app` | app | 00:00 | 08:00 |
| `/api/cron/design` | design | 06:00 | 14:00 |
| `/api/cron/uxui` | uxui | 12:00 | 20:00 |
| `/api/cron/tech` | tech | 18:00 | 02:00 |

- `fetchers/index.ts` 新增 `fetchByCategory(category)` 函数
- `vercel.json` 更新为 4 条 cron 配置

---

## 技术栈
- **框架**：Next.js 15 (App Router)
- **数据库**：Supabase (PostgreSQL)
- **部署**：Vercel (Hobby Plan)
- **样式**：Tailwind CSS
- **RSS 解析**：rss-parser（含 15s timeout）
- **抓取**：自定义 GenericScraper + HackerNewsFetcher + GithubTrendingFetcher + HuggingFaceFetcher
