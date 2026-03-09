import { test, expect, _electron, type ElectronApplication, type Page } from '@playwright/test'
import path from 'path'

let app: ElectronApplication
let page: Page
const screenshotDir = path.join(__dirname, 'screenshots')

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

test('Diagnose theme switching', async () => {
  // Check initial state
  const initial = await page.evaluate(() => {
    const html = document.documentElement
    const body = document.body
    const rootEl = document.getElementById('root')
    return {
      dataTheme: html.getAttribute('data-theme'),
      bgColor: getComputedStyle(body).backgroundColor,
      rootBgColor: rootEl ? getComputedStyle(rootEl).backgroundColor : 'no-root',
      colorBgVar: getComputedStyle(html).getPropertyValue('--color-bg').trim(),
      appBgVar: getComputedStyle(html).getPropertyValue('--app-bg').trim(),
      storeTheme: (window as any).__appStore?.getState().theme
    }
  })
  console.log('INITIAL STATE:', JSON.stringify(initial, null, 2))

  // Toggle to light
  await page.evaluate(() => {
    (window as any).__appStore?.getState().toggleTheme()
  })
  await page.waitForTimeout(500)

  const afterToggle = await page.evaluate(() => {
    const html = document.documentElement
    const body = document.body
    const rootEl = document.getElementById('root')
    return {
      dataTheme: html.getAttribute('data-theme'),
      bgColor: getComputedStyle(body).backgroundColor,
      rootBgColor: rootEl ? getComputedStyle(rootEl).backgroundColor : 'no-root',
      colorBgVar: getComputedStyle(html).getPropertyValue('--color-bg').trim(),
      appBgVar: getComputedStyle(html).getPropertyValue('--app-bg').trim(),
      storeTheme: (window as any).__appStore?.getState().theme
    }
  })
  console.log('AFTER TOGGLE (should be light):', JSON.stringify(afterToggle, null, 2))

  await page.screenshot({ path: path.join(screenshotDir, 'diag-light.png'), fullPage: true })

  expect(afterToggle.dataTheme).toBe('light')
  expect(afterToggle.storeTheme).toBe('light')
})
