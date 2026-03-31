const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Footer, Header
} = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 160 },
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial" })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: "333333" })]
  });
}
function h3(text) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, font: "Arial", color: "555555" })]
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, font: "Arial", ...opts })]
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, font: "Arial" })]
  });
}
function versionTag(v, title, color = "1a1a1a") {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({ text: v + " — ", bold: true, size: 24, font: "Arial", color: "666666" }),
      new TextRun({ text: title, bold: true, size: 24, font: "Arial", color })
    ]
  });
}
function empty() {
  return new Paragraph({ children: [new TextRun("")], spacing: { after: 80 } });
}

function headerRow(cells) {
  return new TableRow({
    children: cells.map(([text, width]) => new TableCell({
      borders,
      width: { size: width, type: WidthType.DXA },
      shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, font: "Arial" })] })]
    }))
  });
}
function dataRow(cells, widths) {
  return new TableRow({
    children: cells.map((text, i) => new TableCell({
      borders,
      width: { size: widths[i], type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: "Arial" })] })]
    }))
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: "111111" },
        paragraph: { spacing: { before: 400, after: 160 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "222222" },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // Title
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 80 },
        children: [new TextRun({ text: "AI NEWS", bold: true, size: 52, font: "Arial", color: "111111" })]
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: "Vibe Coding 项目日志", size: 28, font: "Arial", color: "888888" })]
      }),
      new Paragraph({
        spacing: { after: 400 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD", space: 1 } },
        children: [new TextRun({ text: "作者：huijia zhang　　日期：2026年3月　　协作工具：Claude Code", size: 20, font: "Arial", color: "AAAAAA" })]
      }),
      empty(),

      // 一
      h1("一、项目背景与目的"),
      p("AI NEWS 是一个为设计团队打造的 AI 行业资讯聚合平台，通过自动抓取全球 40+ 优质来源网站的 RSS / API 数据，每日更新内容，帮助团队高效浏览 AI、设计、UX/UI 和技术前沿动态，无需手动翻查各类网站。"),
      empty(),
      p("平台按内容类型分为四个频道："),
      bullet("Pick（精选）：跨频道混合最新内容，首页展示"),
      bullet("Tool：AI 工具与产品资讯，面向大众读者"),
      bullet("Visual：设计灵感与创意作品"),
      bullet("UX/UI：用户体验设计方法论与案例"),
      bullet("Tech：AI 研究、开源代码、学术论文，面向开发者"),
      empty(),
      p("网站已部署至 Vercel，可通过公开链接分享给团队同事："),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "https://ai-news-swart-six.vercel.app", size: 22, font: "Arial", color: "2563EB" })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "GitHub：https://github.com/0830harper/AI-NEWS", size: 22, font: "Arial", color: "2563EB" })]
      }),
      empty(),

      // 二
      h1("二、技术栈与运行环境"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2500, 6526],
        rows: [
          headerRow([["模块", 2500], ["技术选型", 6526]]),
          dataRow(["前端框架", "Next.js 16.1.7 (Turbopack) + TypeScript + Tailwind CSS"], [2500, 6526]),
          dataRow(["数据库", "Supabase (PostgreSQL) — articles、sources 两张核心表"], [2500, 6526]),
          dataRow(["部署平台", "Vercel（GitHub 连接自动 CI/CD，push 即部署）"], [2500, 6526]),
          dataRow(["数据抓取", "RSS / API / Scraper 三种模式，Node.js 运行时"], [2500, 6526]),
          dataRow(["定时任务", "Vercel Cron Job，每日北京时间下午 4 点自动更新"], [2500, 6526]),
          dataRow(["本地开发", "npm run dev（http://localhost:3000）"], [2500, 6526]),
        ]
      }),
      empty(),

      // 三
      h1("三、数据库结构"),
      h2("sources 表（来源配置）"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 1800, 5226],
        rows: [
          headerRow([["字段", 2000], ["类型", 1800], ["说明", 5226]]),
          dataRow(["slug", "text (PK)", "来源唯一标识符，如 techcrunch-ai"], [2000, 1800, 5226]),
          dataRow(["name", "text", "显示名称，如 TechCrunch AI"], [2000, 1800, 5226]),
          dataRow(["category", "text", "所属频道：app / design / uxui / tech"], [2000, 1800, 5226]),
          dataRow(["fetch_type", "text", "抓取方式：rss / api / scraper"], [2000, 1800, 5226]),
          dataRow(["fetch_url", "text", "抓取地址（RSS feed 或 API endpoint）"], [2000, 1800, 5226]),
          dataRow(["fetch_status", "text", "最近一次抓取状态：ok / error"], [2000, 1800, 5226]),
        ]
      }),
      empty(),
      h2("articles 表（文章内容）"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 1800, 5226],
        rows: [
          headerRow([["字段", 2000], ["类型", 1800], ["说明", 5226]]),
          dataRow(["id", "uuid (PK)", "文章唯一 ID"], [2000, 1800, 5226]),
          dataRow(["source_id", "uuid (FK)", "关联 sources 表"], [2000, 1800, 5226]),
          dataRow(["title", "text", "文章标题（已做 HTML 实体解码）"], [2000, 1800, 5226]),
          dataRow(["description", "text", "摘要（最多 2 行截断显示）"], [2000, 1800, 5226]),
          dataRow(["thumbnail", "text", "封面图 URL"], [2000, 1800, 5226]),
          dataRow(["card_color", "text", "卡片背景色（随机分配）"], [2000, 1800, 5226]),
          dataRow(["published_at", "timestamptz", "原帖发布时间（RSS pubDate）"], [2000, 1800, 5226]),
          dataRow(["heat_score", "int", "点击计数（点击即 +1）"], [2000, 1800, 5226]),
        ]
      }),
      empty(),

      // 四
      h1("四、核心功能说明"),
      h2("数据抓取流程"),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "定时触发：每日 UTC 08:00（北京时间 16:00）Vercel Cron 调用 /api/cron", size: 22, font: "Arial" })]
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "抓取所有来源：RSS 解析 / Reddit API / 自定义 Scraper", size: 22, font: "Arial" })]
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "标题清洗：HTML 实体解码（&amp; &#x...;）、乱码过滤（连续 ? 字符检测）", size: 22, font: "Arial" })]
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "去重写入：以 URL 为唯一键，已存在则跳过", size: 22, font: "Arial" })]
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 160 },
        children: [new TextRun({ text: "多样化：每个来源最多 4 篇，避免单一来源占据整页", size: 22, font: "Arial" })]
      }),
      empty(),
      h2("卡片展示逻辑"),
      bullet("有封面图：彩色色块 + 图片（三边等距留白），文字在色块下方"),
      bullet("无封面图：纯彩色色块，标题在色块内，小字为白色"),
      bullet("首页 Pick 页：每张卡片显示分类 tag（Tool / Visual / UX/UI / Tech）"),
      bullet("交错排列：有图和无图卡片穿插，避免视觉单调"),
      empty(),
      h2("分页加载"),
      bullet("每次加载 20 条，点击「Load More」追加下一批"),
      bullet("采用顺序分页：offset = (page-1) × 20，无重复"),
      bullet("当返回 0 条时显示「You've reached the end」"),
      bullet("时间范围：最近 90 天内的文章"),
      empty(),

      // 五
      h1("五、来源网站名单（40 个，各频道 10 个）"),

      h2("🔧 Tool — AI 资讯（面向大众）"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 2000, 4026],
        rows: [
          headerRow([["网站名称", 3000], ["抓取方式", 2000], ["网址", 4026]]),
          dataRow(["TechCrunch AI", "RSS", "techcrunch.com/category/artificial-intelligence"], [3000, 2000, 4026]),
          dataRow(["The Verge AI", "RSS", "theverge.com/ai-artificial-intelligence"], [3000, 2000, 4026]),
          dataRow(["VentureBeat", "RSS", "venturebeat.com/ai"], [3000, 2000, 4026]),
          dataRow(["MIT Tech Review", "RSS", "technologyreview.com"], [3000, 2000, 4026]),
          dataRow(["Reddit r/artificial", "API", "reddit.com/r/artificial"], [3000, 2000, 4026]),
          dataRow(["AI Business", "RSS", "aibusiness.com"], [3000, 2000, 4026]),
          dataRow(["Ars Technica", "RSS", "arstechnica.com"], [3000, 2000, 4026]),
          dataRow(["AI Today", "Scraper", "aitoday.io"], [3000, 2000, 4026]),
          dataRow(["Radar AI", "Scraper", "radarai.top"], [3000, 2000, 4026]),
          dataRow(["量子位", "RSS", "qbitai.com"], [3000, 2000, 4026]),
        ]
      }),
      empty(),

      h2("🎨 Visual — 设计灵感"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 2000, 4026],
        rows: [
          headerRow([["网站名称", 3000], ["抓取方式", 2000], ["网址", 4026]]),
          dataRow(["Behance", "RSS", "behance.net"], [3000, 2000, 4026]),
          dataRow(["Abduzeedo", "RSS", "abduzeedo.com"], [3000, 2000, 4026]),
          dataRow(["We and the Color", "RSS", "weandthecolor.com"], [3000, 2000, 4026]),
          dataRow(["Logo Design Love", "RSS", "logodesignlove.com"], [3000, 2000, 4026]),
          dataRow(["Design Milk", "RSS", "design-milk.com"], [3000, 2000, 4026]),
          dataRow(["Creative Bloq", "RSS", "creativebloq.com"], [3000, 2000, 4026]),
          dataRow(["Colossal", "RSS", "thisiscolossal.com"], [3000, 2000, 4026]),
          dataRow(["Designboom", "RSS", "designboom.com"], [3000, 2000, 4026]),
          dataRow(["Dezeen", "RSS", "dezeen.com"], [3000, 2000, 4026]),
          dataRow(["The Dieline", "RSS", "thedieline.com"], [3000, 2000, 4026]),
        ]
      }),
      empty(),

      h2("🖱 UX/UI — 用户体验"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 2000, 4026],
        rows: [
          headerRow([["网站名称", 3000], ["抓取方式", 2000], ["网址", 4026]]),
          dataRow(["UX Collective", "RSS", "uxdesign.cc"], [3000, 2000, 4026]),
          dataRow(["UX Planet", "RSS", "uxplanet.org"], [3000, 2000, 4026]),
          dataRow(["Nielsen Norman Group", "RSS", "nngroup.com"], [3000, 2000, 4026]),
          dataRow(["Smashing Magazine", "RSS", "smashingmagazine.com"], [3000, 2000, 4026]),
          dataRow(["A List Apart", "RSS", "alistapart.com"], [3000, 2000, 4026]),
          dataRow(["Sidebar", "RSS", "sidebar.io"], [3000, 2000, 4026]),
          dataRow(["Boxes and Arrows", "RSS", "boxesandarrows.com"], [3000, 2000, 4026]),
          dataRow(["UX Magazine", "RSS", "uxmag.com"], [3000, 2000, 4026]),
          dataRow(["UX Matters", "RSS", "uxmatters.com"], [3000, 2000, 4026]),
          dataRow(["Bootcamp", "RSS", "bootcamp.uxdesign.cc"], [3000, 2000, 4026]),
        ]
      }),
      empty(),

      h2("⚙️ Tech — 技术研究 / 开发者"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 2000, 4026],
        rows: [
          headerRow([["网站名称", 3000], ["抓取方式", 2000], ["网址", 4026]]),
          dataRow(["GitHub Trending", "Scraper", "github.com/trending"], [3000, 2000, 4026]),
          dataRow(["Hacker News", "API", "news.ycombinator.com"], [3000, 2000, 4026]),
          dataRow(["Hugging Face Papers", "Scraper", "huggingface.co/papers"], [3000, 2000, 4026]),
          dataRow(["arXiv cs.AI", "RSS", "arxiv.org/list/cs.AI/recent"], [3000, 2000, 4026]),
          dataRow(["OpenAI Blog", "RSS", "openai.com/blog"], [3000, 2000, 4026]),
          dataRow(["Google AI Dev Blog", "RSS", "developers.googleblog.com"], [3000, 2000, 4026]),
          dataRow(["LangChain Blog", "RSS", "blog.langchain.dev"], [3000, 2000, 4026]),
          dataRow(["Papers with Code", "RSS", "paperswithcode.com"], [3000, 2000, 4026]),
          dataRow(["Towards Data Science", "RSS", "towardsdatascience.com"], [3000, 2000, 4026]),
          dataRow(["DeepMind Blog", "RSS", "deepmind.google/blog"], [3000, 2000, 4026]),
        ]
      }),
      empty(),

      // 六
      h1("六、版本迭代记录"),

      versionTag("v1.0", "项目初始化"),
      bullet("Next.js + Supabase 项目脚手架搭建"),
      bullet("设计 articles / sources 数据库表结构"),
      bullet("实现 RSS / API / Scraper 三种抓取模式基础框架"),
      bullet("首页 Masonry 瀑布流卡片网格"),
      bullet("四个分类页（Tool / Visual / UX/UI / Tech）"),
      empty(),

      versionTag("v1.1", "卡片样式重设计"),
      bullet("有图卡片：彩色色块 + 图片三边等距留白（底部贴边）"),
      bullet("无图卡片：纯彩色背景，标题留在色块内，小字改为白色提升可读性"),
      bullet("悬停效果：卡片微微上移 + 阴影增强"),
      bullet("卡片间距加大，来源名与日期视觉层级更清晰"),
      empty(),

      versionTag("v1.2", "导航 Icon 重设计"),
      bullet("从 emoji 改为自定义 SVG 图标"),
      bullet("采用 pudding.cool 风格：粗体填充 + 白色描边贴纸效果"),
      bullet("使用 paintOrder: stroke fill CSS 技巧让白边在填充色之下渲染"),
      bullet("六个 icon：LightningIcon / PhoneIcon / BrushIcon / LayersIcon / ChipIcon / SignalIcon"),
      empty(),

      versionTag("v1.3", "标题乱码修复"),
      bullet("问题：部分 RSS 来源标题出现「???????????」乱码（非 ASCII 字符编码失败）"),
      bullet("修复 1：在 base.ts cleanText() 中加入完整 HTML 实体解码（&#x...;、&#...;、&amp; 等）"),
      bullet("修复 2：API 路由新增 hasGarbageTitle() 过滤器（连续 ? 占比 > 30% 则过滤）"),
      empty(),

      versionTag("v1.4", "分类页无限加载"),
      bullet("新建 CategoryFeed.tsx 客户端组件，支持 Load More 按钮分页"),
      bullet("顺序分页逻辑：offset = (page-1) × limit，无数据重叠"),
      bullet("时间范围扩展：7 天 → 90 天"),
      bullet("hasMore 判断：返回 0 条时显示「You've reached the end」"),
      empty(),

      versionTag("v1.5", "Vercel 部署上线"),
      bullet("GitHub 仓库：github.com/0830harper/AI-NEWS（私有仓库，3 人协作）"),
      bullet("Vercel 连接 GitHub，push main 分支自动触发部署"),
      bullet("Supabase 环境变量配置：NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY"),
      bullet("Vercel Cron Job 配置：UTC 08:00 每日自动抓取（北京时间 16:00）"),
      bullet("修复构建报错：supabaseKey is required — 补全 Vercel 端环境变量后解决"),
      empty(),

      versionTag("v1.6", "首页升级 + 分类 Tag"),
      bullet("首页 Pick 页改为客户端组件，支持「Load More」无限加载（复用 CategoryFeed）"),
      bullet("首页每张卡片新增分类来源 Tag（Tool / Visual / UX/UI / Tech）"),
      bullet("Source 页面从导航栏移至页脚（隐藏给普通用户，开发者可见）"),
      bullet("导航栏标签重命名：Latest→Pick / App→Tool / Design→Visual"),
      empty(),

      versionTag("v1.7", "来源库整理与扩充"),
      bullet("清理 23 个无效来源（抓取 0 条文章的 scraper 网站）"),
      bullet("补充 13 个有效 RSS 来源，各频道扩充至 10 个，共 40 个来源"),
      bullet("修正分类错误：DeepMind Blog（研究型）归入 Tech，Radar AI 保留在 Tool"),
      bullet("Visual 分类新增：Design Milk / Creative Bloq / Colossal / Designboom / Dezeen / The Dieline"),
      bullet("Tech 分类新增：OpenAI Blog / Papers with Code / Towards Data Science"),
      empty(),

      // 七
      h1("七、已知问题与注意事项"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2800, 6226],
        rows: [
          headerRow([["问题", 2800], ["说明 / 解决方案", 6226]]),
          dataRow(["部分标题仍有乱码", "连续 ? 数量未达过滤阈值（<30%），可调低阈值或人工清理数据库"], [2800, 6226]),
          dataRow(["Source Status 显示旧数据", "Vercel 页面缓存，重新部署后自动更新"], [2800, 6226]),
          dataRow(["公司网络无法访问 Vercel", "Vercel.app 被企业防火墙拦截，建议用手机热点或 VPN 访问"], [2800, 6226]),
          dataRow(["首页精选无真实热度排序", "当前按发布时间倒序，后期可接入 Hacker News 评分等第三方热度 API"], [2800, 6226]),
          dataRow(["每日更新一次（Hobby 限制）", "Vercel Hobby 计划 Cron 最少间隔为每日一次，升级 Pro 可提高频率"], [2800, 6226]),
        ]
      }),
      empty(),
      empty(),

      new Paragraph({
        spacing: { before: 400 },
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD", space: 1 } },
        children: [new TextRun({ text: "AI NEWS Vibe Coding 日志 · 2026年3月 · 使用 Claude Code 辅助开发", size: 18, font: "Arial", color: "BBBBBB" })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/huijia.zhang/Desktop/AI NEWS Coding 日志.docx", buffer);
  console.log("Done! Saved to Desktop.");
});
