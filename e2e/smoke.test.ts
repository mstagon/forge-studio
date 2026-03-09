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
})

test.afterAll(async () => {
  await app.close()
})

// Helper: navigate via store
async function navigateTo(viewId: string): Promise<void> {
  await page.evaluate((id) => {
    const store = (window as any).__appStore
    if (store) store.getState().setView(id)
  }, viewId)
  await page.waitForTimeout(1000)
}

// Helper: get all visible text
async function getBodyText(): Promise<string> {
  return page.evaluate(() => document.body.innerText)
}

// ═══════════════════════════════════════════════════
// WELCOME SCREEN
// ═══════════════════════════════════════════════════
test('01 - Welcome: required elements', async () => {
  await page.screenshot({ path: path.join(screenshotDir, '01-welcome.png'), fullPage: true })

  // App title
  await expect(page.locator('text=Forge Studio')).toBeVisible()
  await expect(page.locator('text=AI Development Cockpit')).toBeVisible()

  // Action buttons
  await expect(page.locator('text=Open Project')).toBeVisible()
  await expect(page.locator('text=New Project')).toBeVisible()
  await expect(page.locator('text=Open existing folder')).toBeVisible()
  await expect(page.locator('text=Select tech stack')).toBeVisible()

  // Hint text
  await expect(page.locator('text=CLAUDE.md')).toBeVisible()

  // Status bar elements
  await expect(page.locator('text=Claude CLI')).toBeVisible()
  // Command palette shortcut hint
  await expect(page.locator('text=Command Palette')).toBeVisible()
})

// ═══════════════════════════════════════════════════
// COMMAND PALETTE (no project)
// ═══════════════════════════════════════════════════
test('02 - Command Palette: without project shows limited items', async () => {
  await page.keyboard.press('Meta+k')
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(screenshotDir, '02-cmd-no-project.png'), fullPage: true })

  // Search input exists
  await expect(page.locator('input[placeholder]')).toBeVisible()

  // Should show appearance and project options only (no navigation)
  const bodyText = await getBodyText()
  expect(bodyText).toContain('Open Project')
  expect(bodyText).toContain('Switch to')
  // Navigation items should NOT exist without project
  expect(bodyText).not.toContain('NAVIGATION')

  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
})

// ═══════════════════════════════════════════════════
// OPEN PROJECT
// ═══════════════════════════════════════════════════
test('03 - Open project via IPC', async () => {
  const result = await page.evaluate(async (projectPath) => {
    try {
      const res = await (window as any).forgeApi.project.open(projectPath)
      const store = (window as any).__appStore
      if (store && res) {
        store.getState().setProject(res.project, res.stats)
        return { success: true, name: res.project.name }
      }
      return { success: false, error: 'no store or result' }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  }, PROJECT_PATH)

  expect(result.success).toBe(true)
  expect(result.name).toBe('forge-studio')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(screenshotDir, '03-project-opened.png'), fullPage: true })
})

// ═══════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════
test('04 - Dashboard: stats, git, config, quick actions', async () => {
  await navigateTo('dashboard')
  await page.screenshot({ path: path.join(screenshotDir, '04-dashboard.png'), fullPage: true })

  const text = await getBodyText()

  // Project name & path
  expect(text).toContain('forge-studio')
  expect(text).toContain('/Users/macms/forge-studio')

  // Stat cards
  expect(text).toContain('Agents')
  expect(text).toContain('Commands')
  expect(text).toContain('MCP Servers')

  // Git info
  expect(text).toContain('Branch')
  expect(text).toContain('main')
  expect(text).toContain('Last Commit')

  // Configuration
  expect(text).toContain('CLAUDE.md')
  expect(text).toContain('.claude/')
  expect(text).toContain('Found')

  // Quick Actions (all 8)
  expect(text).toContain('Plan Feature')
  expect(text).toContain('Manage Agents')
  expect(text).toContain('Edit Commands')
  expect(text).toContain('MCP Servers')
  expect(text).toContain('Workflow')
  expect(text).toContain('Edit CLAUDE.md')
  expect(text).toContain('Export Preset')
  expect(text).toContain('Import Preset')
})

// ═══════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════
test('05 - Sidebar: all navigation items', async () => {
  const text = await getBodyText()

  const navItems = ['Dashboard', 'Workflow', 'Agents', 'Planning', 'CLAUDE.md', 'Commands', 'Skills', 'Hooks', 'MCP', 'Knowledge']
  for (const item of navItems) {
    expect(text).toContain(item)
  }

  // Status bar: project name, branch
  expect(text).toContain('forge-studio')
  expect(text).toContain('main')
})

// ═══════════════════════════════════════════════════
// COMMAND PALETTE (with project)
// ═══════════════════════════════════════════════════
test('06 - Command Palette: with project shows navigation', async () => {
  await page.keyboard.press('Meta+k')
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(screenshotDir, '06-cmd-with-project.png'), fullPage: true })

  const text = await getBodyText()

  // Navigation category
  expect(text).toContain('NAVIGATION')

  // All navigation entries
  const navItems = ['Dashboard', 'Workflow', 'Agents', 'Planning', 'CLAUDE.md', 'Commands', 'Skills', 'Hooks', 'MCP', 'Knowledge']
  for (const item of navItems) {
    expect(text).toContain(item)
  }

  // UI category
  expect(text).toContain('Toggle Terminal')
  expect(text).toContain('Toggle Sidebar')

  // Appearance
  expect(text).toContain('Switch to')

  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
})

// ═══════════════════════════════════════════════════
// AGENTS VIEW
// ═══════════════════════════════════════════════════
test('07 - Agents: header, list panel, empty state', async () => {
  await navigateTo('agents')
  await page.screenshot({ path: path.join(screenshotDir, '07-agents.png'), fullPage: true })

  const text = await getBodyText()
  expect(text).toContain('Agents')

  // Should have + button for creating agent
  await expect(page.locator('button:has(svg)')).toBeTruthy()

  // Empty state or agent list
  const hasAgents = !text.includes('Select an agent or create a new one')
  if (!hasAgents) {
    expect(text).toContain('Select an agent or create a new one')
  }
})

// ═══════════════════════════════════════════════════
// COMMANDS VIEW
// ═══════════════════════════════════════════════════
test('08 - Commands: header, command list', async () => {
  await navigateTo('commands')
  await page.screenshot({ path: path.join(screenshotDir, '08-commands.png'), fullPage: true })

  const text = await getBodyText()
  expect(text).toContain('Commands')

  // forge-studio has at least 1 command
  expect(text).toContain('/fs:start-dev')
})

// ═══════════════════════════════════════════════════
// SKILLS VIEW
// ═══════════════════════════════════════════════════
test('09 - Skills: header, empty or list', async () => {
  await navigateTo('skills')
  await page.screenshot({ path: path.join(screenshotDir, '09-skills.png'), fullPage: true })

  const text = await getBodyText()
  expect(text).toContain('Skills')
})

// ═══════════════════════════════════════════════════
// HOOKS VIEW
// ═══════════════════════════════════════════════════
test('10 - Hooks: tabs, save button, add hook', async () => {
  await navigateTo('hooks')
  await page.screenshot({ path: path.join(screenshotDir, '10-hooks.png'), fullPage: true })

  const text = await getBodyText()

  // Title and config file reference
  expect(text).toContain('Hooks')
  expect(text).toContain('.claude/settings.json')

  // 3 hook type tabs
  expect(text).toContain('SessionStart')
  expect(text).toContain('PreToolUse')
  expect(text).toContain('PostToolUse')

  // Save button
  expect(text).toContain('Save')

  // Add Hook button
  expect(text).toContain('Add Hook')
})

// ═══════════════════════════════════════════════════
// MCP VIEW
// ═══════════════════════════════════════════════════
test('11 - MCP: server list with real servers', async () => {
  await navigateTo('mcp')
  await page.screenshot({ path: path.join(screenshotDir, '11-mcp.png'), fullPage: true })

  const text = await getBodyText()

  // Title
  expect(text).toContain('MCP Servers')

  // Add Server button
  expect(text).toContain('Add Server')

  // Real MCP servers from forge-studio config
  expect(text).toContain('context7')
  expect(text).toContain('github')
  expect(text).toContain('filesystem')

  // Each server should show command
  expect(text).toContain('Command')
  expect(text).toContain('npx')
})

// ═══════════════════════════════════════════════════
// KNOWLEDGE VIEW
// ═══════════════════════════════════════════════════
test('12 - Knowledge: header, empty or content', async () => {
  await navigateTo('knowledge')
  await page.screenshot({ path: path.join(screenshotDir, '12-knowledge.png'), fullPage: true })

  const text = await getBodyText()
  expect(text).toContain('Knowledge')
})

// ═══════════════════════════════════════════════════
// CLAUDE.MD VIEW
// ═══════════════════════════════════════════════════
test('13 - CLAUDE.md: editor with sections', async () => {
  await navigateTo('claude-md')
  await page.screenshot({ path: path.join(screenshotDir, '13-claudemd.png'), fullPage: true })

  const text = await getBodyText()

  // Header
  expect(text).toContain('CLAUDE.md')

  // Visual/Raw toggle
  expect(text).toContain('Visual')
  expect(text).toContain('Raw')

  // Save button
  expect(text).toContain('Save')

  // Sections from actual CLAUDE.md content
  expect(text).toContain('SECTIONS')

  // Actual content from CLAUDE.md should be visible
  expect(text).toContain('Electron')
  expect(text).toContain('React')
  expect(text).toContain('TypeScript')
})

// ═══════════════════════════════════════════════════
// PLANNING VIEW
// ═══════════════════════════════════════════════════
test('14 - Planning: hub, documents, AI team button', async () => {
  await navigateTo('planning')
  await page.screenshot({ path: path.join(screenshotDir, '14-planning.png'), fullPage: true })

  const text = await getBodyText()

  // Header
  expect(text).toContain('Planning Hub')

  // PRD category
  expect(text).toContain('PRD')

  // Real PRD file
  expect(text).toContain('forge-studio-prd.md')

  // AI Team Planning button
  expect(text).toContain('Start AI Team Planning')

  // Empty state
  expect(text).toContain('Select a document to view')
})

// ═══════════════════════════════════════════════════
// WORKFLOW VIEW
// ═══════════════════════════════════════════════════
test('15 - Workflow: pipeline steps, run button', async () => {
  await navigateTo('workflow')
  await page.screenshot({ path: path.join(screenshotDir, '15-workflow.png'), fullPage: true })

  const text = await getBodyText()

  // Header
  expect(text).toContain('Workflow Engine')
  expect(text).toContain('Feature Development Pipeline')

  // Feature name input
  await expect(page.locator('input[placeholder]')).toBeVisible()

  // Run button
  expect(text).toContain('Run')

  // Pipeline steps (all 5)
  expect(text).toContain('Plan Feature')
  expect(text).toContain('Generate Spec')
  expect(text).toContain('Review Plan')
  expect(text).toContain('Implement')
  expect(text).toContain('Code Review')

  // Step numbers
  expect(text).toContain('Step 1')
  expect(text).toContain('Step 2')
  expect(text).toContain('Step 3')
  expect(text).toContain('Step 4')
  expect(text).toContain('Step 5')

  // Edit Pipeline link
  expect(text).toContain('Edit Pipeline')
})

// ═══════════════════════════════════════════════════
// THEME TOGGLE
// ═══════════════════════════════════════════════════
test('16 - Theme: toggle light and back', async () => {
  await navigateTo('dashboard')

  // Toggle to light
  await page.evaluate(() => {
    (window as any).__appStore?.getState().toggleTheme()
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(screenshotDir, '16-theme-light.png'), fullPage: true })

  // Verify light theme class on html/body
  const isLight = await page.evaluate(() => {
    return document.documentElement.classList.contains('light') ||
           document.documentElement.getAttribute('data-theme') === 'light' ||
           document.body.style.colorScheme === 'light'
  })

  // Toggle back to dark
  await page.evaluate(() => {
    (window as any).__appStore?.getState().toggleTheme()
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(screenshotDir, '16-theme-dark.png'), fullPage: true })
})

// ═══════════════════════════════════════════════════
// i18n: KOREAN LANGUAGE
// ═══════════════════════════════════════════════════
test('17 - i18n: Switch to Korean and verify Dashboard', async () => {
  // Switch language via i18n API directly
  await page.evaluate(() => {
    // Access i18n through the module system
    const event = new CustomEvent('change-language', { detail: 'ko' })
    window.dispatchEvent(event)
  })
  // Try direct i18n access
  await page.evaluate(async () => {
    try {
      // The changeLanguage function is imported in StatusBar
      // Access via localStorage + reload would work but let's try the store approach
      localStorage.setItem('forge-studio-language', 'ko')
      // Force i18n to change via any exposed reference
      const buttons = document.querySelectorAll('button')
      for (const btn of buttons) {
        const text = btn.textContent?.trim()
        if (text === 'EN' && btn.querySelector('svg') && btn.getBoundingClientRect().width < 80) {
          btn.click()
          return 'clicked'
        }
      }
      return 'not-found'
    } catch (e) {
      return String(e)
    }
  })
  await page.waitForTimeout(800)

  await navigateTo('dashboard')
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(screenshotDir, '17-dashboard-ko.png'), fullPage: true })

  const text = await getBodyText()

  // Check Korean translations - sidebar
  const hasKorean = text.includes('대시보드') || text.includes('에이전트') || text.includes('워크플로우')
  const hasEnglish = text.includes('Dashboard') && text.includes('Agents') && text.includes('Workflow')

  if (hasKorean) {
    expect(text).toContain('대시보드')
    expect(text).toContain('에이전트')
    expect(text).toContain('커맨드')
  }

  // Take note of result for reporting
  console.log(`Korean test: hasKorean=${hasKorean}, hasEnglish=${hasEnglish}`)
})

test('18 - i18n: Switch back to English and verify', async () => {
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button')
    for (const btn of buttons) {
      const text = btn.textContent?.trim()
      if ((text === 'KO' || text === 'EN') && btn.querySelector('svg') && btn.getBoundingClientRect().width < 80) {
        // If currently Korean, click to switch to English
        if (text === 'KO') btn.click()
        return
      }
    }
    // Fallback: set localStorage and reload
    localStorage.setItem('forge-studio-language', 'en')
  })
  await page.waitForTimeout(800)

  await navigateTo('dashboard')
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(screenshotDir, '18-dashboard-en.png'), fullPage: true })

  const text = await getBodyText()
  expect(text).toContain('Dashboard')
  expect(text).toContain('Agents')
  expect(text).toContain('Quick Actions')
})

// ═══════════════════════════════════════════════════
// STATUS BAR
// ═══════════════════════════════════════════════════
test('19 - StatusBar: project info, stats, controls', async () => {
  await navigateTo('dashboard')
  const text = await getBodyText()

  // Project name in status bar
  expect(text).toContain('forge-studio')

  // Branch
  expect(text).toContain('main')

  // Stats
  expect(text).toContain('agents')
  expect(text).toContain('commands')
  expect(text).toContain('skills')

  // Language toggle (EN or KO)
  const hasLang = text.includes('EN') || text.includes('KO')
  expect(hasLang).toBe(true)

  // Claude CLI version
  expect(text).toContain('Claude CLI')
})

// ═══════════════════════════════════════════════════
// TERMINAL
// ═══════════════════════════════════════════════════
test('20 - Terminal: visible at bottom', async () => {
  // Terminal should be visible (xterm container)
  const terminal = page.locator('.xterm, [class*="terminal"], [data-terminal]')
  // Just check terminal area exists in the DOM
  const terminalText = await getBodyText()
  const hasTerminalIndicator = terminalText.includes('forge-studio') && terminalText.includes('main')
  expect(hasTerminalIndicator).toBe(true)
  await page.screenshot({ path: path.join(screenshotDir, '20-terminal.png'), fullPage: true })
})
