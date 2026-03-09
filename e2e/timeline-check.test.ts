import { test, expect, _electron, type ElectronApplication, type Page } from '@playwright/test'
import path from 'path'

let app: ElectronApplication
let page: Page
const screenshotDir = path.join(__dirname, 'screenshots')
const PROJECT_PATH = path.join(__dirname, '..')

test.beforeAll(async () => {
  app = await _electron.launch({
    args: [path.join(__dirname, '..', 'out', 'main', 'index.js')],
    env: { ...process.env, NODE_ENV: 'production' }
  })
  page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(2000)

  // Open project
  await page.evaluate(async (projectPath) => {
    const res = await (window as any).forgeApi.project.open(projectPath)
    const store = (window as any).__appStore
    if (store && res) store.getState().setProject(res.project, res.stats)
  }, PROJECT_PATH)
  await page.waitForTimeout(1500)
})

test.afterAll(async () => {
  await app.close()
})

test('Timeline view - screenshot and verify', async () => {
  // Navigate to timeline
  await page.evaluate(() => {
    (window as any).__appStore?.getState().setView('timeline')
  })
  await page.waitForTimeout(2000)

  // Screenshot
  await page.screenshot({ path: path.join(screenshotDir, 'timeline-dark.png'), fullPage: true })

  // Verify key elements
  const text = await page.evaluate(() => document.body.innerText)

  // Title
  expect(text).toContain('Timeline')

  // Setup progress section
  expect(text).toContain('CLAUDE.md')
  expect(text).toContain('.claude/')
  expect(text).toContain('Agents')
  expect(text).toContain('Commands')

  // Stats
  expect(text).toContain('Quick Stats')

  // Git commits should be visible (CSS uppercase makes it "RECENT ACTIVITY")
  expect(text.toUpperCase()).toContain('RECENT ACTIVITY')

  console.log('Timeline view text excerpt:', text.slice(0, 500))

  // Light theme screenshot
  await page.evaluate(() => {
    (window as any).__appStore?.getState().toggleTheme()
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(screenshotDir, 'timeline-light.png'), fullPage: true })

  // Toggle back
  await page.evaluate(() => {
    (window as any).__appStore?.getState().toggleTheme()
  })
})

test('Timeline view - dashboard screenshot too', async () => {
  // Navigate to dashboard for comparison
  await page.evaluate(() => {
    (window as any).__appStore?.getState().setView('dashboard')
  })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(screenshotDir, 'dashboard-current.png'), fullPage: true })
})
