/** Category slug → headline under nav (Pick / Tool / … pages) */
const CATEGORY_HEADINGS: Record<string, { en: string; zh: string }> = {
  app: { en: '⚙ Tool', zh: '⚙ 工具' },
  design: { en: '◈ Visual', zh: '◈ 视觉' },
  uxui: { en: '✦ UX / UI', zh: '✦ UX / UI' },
  tech: { en: '⊞ Tech', zh: '⊞ 科技' },
}

export function categoryHeading(slug: string, isZh: boolean): string {
  const h = CATEGORY_HEADINGS[slug]
  return h ? (isZh ? h.zh : h.en) : slug
}

export function sourceTotalLabel(n: number, isZh: boolean) {
  return isZh ? `共 ${n} 个` : `${n} total`
}
export function sourceOkLabel(n: number, isZh: boolean) {
  return isZh ? `${n} 正常` : `${n} ok`
}
export function sourceErrLabel(n: number, isZh: boolean) {
  return isZh ? `${n} 出错` : `${n} errors`
}

export function fetchTypeLabel(fetchType: string, isZh: boolean): string {
  if (!isZh) return fetchType
  const m: Record<string, string> = { rss: 'RSS', api: 'API', scraper: '爬虫' }
  return m[fetchType] ?? fetchType
}

export function fetchStatusLabel(status: string, isZh: boolean): string {
  if (!isZh) return status
  const m: Record<string, string> = { ok: '正常', error: '失败', pending: '待定' }
  return m[status] ?? status
}

export function sourceCategoryLabel(cat: string, isZh: boolean): string {
  if (!isZh) {
    const en: Record<string, string> = {
      app: 'App',
      design: 'Design / ART',
      uxui: 'UX / UI',
      tech: 'Tech',
    }
    return en[cat] ?? cat
  }
  const zh: Record<string, string> = {
    app: '应用',
    design: '设计 / 艺术',
    uxui: 'UX / UI',
    tech: '科技',
  }
  return zh[cat] ?? cat
}

/** Search results line under the search bar */
export function searchResultLine(total: number, q: string, isZh: boolean): string {
  if (isZh) {
    if (total === 0) return `未找到与「${q}」相关的结果`
    return `共 ${total} 条与「${q}」相关`
  }
  if (total === 0) return `No results for "${q}"`
  return `${total} result${total !== 1 ? 's' : ''} for "${q}"`
}

/** UI copy when language toggle is 中 vs EN (article text comes from DB / translate API). */
export function ui(isZh: boolean) {
  if (isZh) {
    return {
      searchPlaceholder: '搜索文章…',
      navPick: '精选',
      navTool: '工具',
      navVisual: '视觉',
      navUxui: 'UX / UI',
      navTech: '科技',
      footerLine: 'Signal Lab — 精选自 50+ 信息源',
      footerUpdated: '每日更新',
      footerSource: '来源列表',
      loading: '加载中…',
      loadMoreAlt: '加载更多',
      endOfFeed: '已经到底啦',
      noArticles: '暂无文章。请运行抓取任务写入内容。',
      searchTryOther: '换个关键词试试。',
      searchHint: '在上方搜索框输入关键词。',
      unknownSource: '未知',
      homeSubtitle: '🔥 近 30 天 · 精选',
      sourceStatusTitle: '📡 来源状态',
      thSource: '来源',
      thCategory: '分类',
      thType: '类型',
      thStatus: '状态',
      thLastFetched: '上次抓取',
    }
  }
  return {
    searchPlaceholder: 'Search articles…',
    navPick: 'Pick',
    navTool: 'Tool',
    navVisual: 'Visual',
    navUxui: 'UX / UI',
    navTech: 'Tech',
    footerLine: 'Signal Lab — Curated from 50+ sources',
    footerUpdated: 'Updated daily',
    footerSource: 'Source list',
    loading: 'Loading...',
    loadMoreAlt: 'Load More',
    endOfFeed: "You've reached the end",
    noArticles: 'No articles yet. Run the fetcher to populate content.',
    searchTryOther: 'Try a different keyword.',
    searchHint: 'Type a keyword in the search bar above.',
    unknownSource: 'Unknown',
    homeSubtitle: '🔥 Past 30 days · Top picks',
    sourceStatusTitle: '📡 Source Status',
    thSource: 'Source',
    thCategory: 'Category',
    thType: 'Type',
    thStatus: 'Status',
    thLastFetched: 'Last Fetched',
  }
}
