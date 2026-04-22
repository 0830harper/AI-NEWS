/**
 * Load More regression: click Load More 3x and assert:
 *   1. No console errors (React infinite loops, application errors)
 *   2. No useLayoutEffect oscillation (no "Maximum update depth exceeded")
 *   3. Column bottom alignment stays within BALANCE_TOLERANCE px
 *
 * Run: npx playwright test tests/load-more.spec.ts
 */
import { test, expect } from '@playwright/test'

// Greedy estimates (TALL=500, SHORT=260) drift ~25px per card vs actual render.
// After 90–120 articles the accumulated drift is ~1000px; 1500px catches real bugs
// (duplicate loads, broken column logic) without false-failing on estimation variance.
const BALANCE_TOLERANCE = 1500

test('Load More ×3 — no crashes, no loops, columns stay balanced', async ({ page }) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', err => pageErrors.push(err.message))

  // ── Initial load ────────────────────────────────────────────────────────────
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-testid="masonry-grid"]', { timeout: 20_000 })
  await page.waitForSelector('[data-testid="article-card"]', { timeout: 20_000 })

  // ── Load More ×3 ────────────────────────────────────────────────────────────
  for (let round = 1; round <= 3; round++) {
    const cardsBefore = await page.locator('[data-testid="article-card"]').count()

    const loadMoreBtn = page.getByRole('button').filter({ has: page.locator('img[alt="Load More"]') })
    await expect(loadMoreBtn).toBeVisible({ timeout: 10_000 })
    await loadMoreBtn.click()

    // Wait for new cards to appear — timeout here catches infinite render loops
    // that would freeze the JS thread and prevent DOM updates.
    await page.waitForFunction(
      (prev: number) => document.querySelectorAll('[data-testid="article-card"]').length > prev,
      cardsBefore,
      { timeout: 15_000 },
    )

    const cardsAfter = await page.locator('[data-testid="article-card"]').count()
    expect(cardsAfter).toBeGreaterThan(cardsBefore)
  }

  // ── Assert: no React / application errors ───────────────────────────────────
  const reactErrors = [
    ...consoleErrors,
    ...pageErrors,
  ].filter(e =>
    e.includes('Maximum update depth') ||
    e.includes('Too many re-renders') ||
    e.includes('Application error') ||
    e.includes('useLayoutEffect') ||
    e.includes('Minified React error'),
  )
  expect(reactErrors, `React errors detected:\n${reactErrors.join('\n')}`).toHaveLength(0)

  // ── Assert: column bottom alignment ─────────────────────────────────────────
  const cols = page.locator('[data-testid="masonry-col"]')
  const colCount = await cols.count()

  if (colCount > 1) {
    const bottoms: number[] = []
    for (let i = 0; i < colCount; i++) {
      const box = await cols.nth(i).boundingBox()
      if (box && box.height > 0) bottoms.push(box.y + box.height)
    }

    if (bottoms.length > 1) {
      const diff = Math.max(...bottoms) - Math.min(...bottoms)
      expect(
        diff,
        `Column bottoms differ by ${diff}px (tolerance: ${BALANCE_TOLERANCE}px). Bottoms: ${bottoms.map(b => Math.round(b)).join(', ')}px`,
      ).toBeLessThanOrEqual(BALANCE_TOLERANCE)
    }
  }
})
