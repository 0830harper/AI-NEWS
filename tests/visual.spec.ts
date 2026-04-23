/**
 * Visual regression: screenshot MasonryGrid at 5 viewport widths.
 *
 * First run (generate baselines):
 *   npx playwright test tests/visual.spec.ts --update-snapshots
 *
 * Subsequent runs (compare):
 *   npx playwright test tests/visual.spec.ts
 */
import { test, expect } from '@playwright/test'
import path from 'path'

const VIEWPORTS = [
  { name: 'mobile',   width: 375,  height: 812  },
  { name: 'tablet',   width: 768,  height: 1024 },
  { name: 'laptop',   width: 1024, height: 768  },
  { name: 'desktop',  width: 1440, height: 900  },
  { name: 'wide',     width: 1920, height: 1080 },
]

const BASELINE_DIR = path.join(__dirname, 'visual-baselines')

for (const vp of VIEWPORTS) {
  test(`MasonryGrid renders correctly at ${vp.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/')

    // Wait for the grid and at least one card
    await page.waitForSelector('[data-testid="masonry-grid"]', { timeout: 20_000 })
    await page.waitForSelector('[data-testid="article-card"]', { timeout: 20_000 })

    // Let images settle (the white-image canvas check is async)
    await page.waitForTimeout(2_500)

    await expect(page).toHaveScreenshot(`masonry-${vp.name}.png`, {
      animations: 'disabled',
      // 5% tolerance: balance correction can shift card order slightly between runs
      maxDiffPixelRatio: 0.05,
      snapshotDir: BASELINE_DIR,
    })
  })
}
