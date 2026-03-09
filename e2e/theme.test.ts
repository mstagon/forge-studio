import { test, _electron, type ElectronApplication, type Page } from '@playwright/test'
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
})

test.afterAll(async () => {
  await app.close()
})

test('Dark theme - Welcome', async () => {
  await page.screenshot({ path: path.join(screenshotDir, 'theme-dark-welcome.png'), fullPage: true })
})

test('Light theme - Welcome', async () => {
  await page.evaluate(() => {
    (window as any).__appStore?.getState().toggleTheme()
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(screenshotDir, 'theme-light-welcome.png'), fullPage: true })
})

test('Open project + light dashboard', async () => {
  await page.evaluate(async (projectPath) => {
    const res = await (window as any).forgeApi.project.open(projectPath)
    const store = (window as any).__appStore
    if (store && res) store.getState().setProject(res.project, res.stats)
  }, PROJECT_PATH)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(screenshotDir, 'theme-light-dashboard.png'), fullPage: true })
})

test('Dark theme - Dashboard', async () => {
  await page.evaluate(() => {
    (window as any).__appStore?.getState().toggleTheme()
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(screenshotDir, 'theme-dark-dashboard.png'), fullPage: true })
})
