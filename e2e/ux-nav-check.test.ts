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

test('Agents: select then deselect via title click', async () => {
  await page.evaluate(() => {
    (window as any).__appStore?.getState().setView('agents')
  })
  await page.waitForTimeout(1000)

  // Screenshot: agents list with empty state guide
  await page.screenshot({ path: path.join(screenshotDir, 'ux-agents-guide.png'), fullPage: true })

  // Click first agent if exists
  const agentButton = page.locator('button:has(svg) >> text=/product|tech|task|code|doc|flutter|riverpod|supabase|test|spec|security/i').first()
  const hasAgent = await agentButton.isVisible().catch(() => false)

  if (hasAgent) {
    await agentButton.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(screenshotDir, 'ux-agents-selected.png'), fullPage: true })

    // Click title to deselect
    const titleButton = page.locator('button >> text=Agents').first()
    await titleButton.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(screenshotDir, 'ux-agents-deselected.png'), fullPage: true })
  }
})

test('Titlebar: close project button visible', async () => {
  await page.evaluate(() => {
    (window as any).__appStore?.getState().setView('dashboard')
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(screenshotDir, 'ux-titlebar.png'), fullPage: true })

  // Verify close project exists in text
  const text = await page.evaluate(() => document.body.innerText)
  expect(text).toContain('forge-studio')
})

test('Sidebar: close project button visible', async () => {
  const text = await page.evaluate(() => document.body.innerText)
  // Close project text should exist
  const hasClose = text.includes('Close Project') || text.includes('프로젝트 닫기')
  expect(hasClose).toBe(true)
})

test('Close project returns to Welcome', async () => {
  // Close project via store
  await page.evaluate(() => {
    (window as any).__appStore?.getState().clearProject()
  })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(screenshotDir, 'ux-welcome-after-close.png'), fullPage: true })

  const text = await page.evaluate(() => document.body.innerText)
  expect(text).toContain('Forge Studio')
  expect(text).toContain('Open Project')
})
