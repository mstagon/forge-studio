import { ipcMain, dialog, app, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { IPC } from '../../shared/constants/channels'
import { createPtySession, writeToPty, resizePty, disposePty, onPtyData, onPtyExit, disposeAll } from '../services/pty-manager'
import { isClaudeInstalled, getClaudeVersion } from '../services/claude-bridge'
import { openProject, getProjectStats, listDirectory } from '../services/project-manager'
import { parseClaudeMd, serializeClaudeMd } from '../services/claude-md-parser'
import { listAgents, saveAgent, deleteAgent, renameAgent, listCommands, saveCommand, deleteCommand, listSkills, saveSkill, deleteSkill, readSettings, writeSettings, listMcpServers } from '../services/config-manager'
import { startWatching } from '../services/file-watcher'
import type { AgentConfig, CommandConfig, SkillConfig, SettingsConfig } from '../../shared/types/agent.types'
import type { ClaudeMdConfig } from '../../shared/types/claude-md.types'

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // ── Terminal / PTY ──

  ipcMain.handle(IPC.TERMINAL_CREATE, async (_event, cwd: string) => {
    const id = createPtySession(cwd)
    onPtyData(id, (data) => {
      if (!mainWindow.isDestroyed()) mainWindow.webContents.send(IPC.TERMINAL_ON_DATA, id, data)
    })
    onPtyExit(id, (exitCode) => {
      if (!mainWindow.isDestroyed()) mainWindow.webContents.send(IPC.TERMINAL_ON_EXIT, id, exitCode)
    })
    return id
  })

  ipcMain.on(IPC.TERMINAL_DATA, (_event, id: string, data: string) => writeToPty(id, data))
  ipcMain.on(IPC.TERMINAL_RESIZE, (_event, id: string, cols: number, rows: number) => resizePty(id, cols, rows))
  ipcMain.on(IPC.TERMINAL_DISPOSE, (_event, id: string) => disposePty(id))

  // ── Project ──

  ipcMain.handle(IPC.PROJECT_OPEN, async (_event, projectPath: string) => {
    const project = await openProject(projectPath)
    const stats = await getProjectStats(projectPath)
    return { project, stats }
  })

  ipcMain.handle(IPC.PROJECT_READ_DIR, async (_event, dirPath: string) => listDirectory(dirPath))

  // ── File Watcher ──

  ipcMain.handle(IPC.FS_START_WATCHING, async (_event, projectPath: string) => {
    startWatching(projectPath, mainWindow)
  })

  // ── File System ──

  ipcMain.handle(IPC.FS_READ_FILE, async (_event, filePath: string) => readFile(filePath, 'utf-8'))
  ipcMain.handle(IPC.FS_WRITE_FILE, async (_event, filePath: string, content: string) => writeFile(filePath, content, 'utf-8'))

  // ── CLAUDE.md ──

  ipcMain.handle(IPC.CLAUDE_MD_READ, async (_event, projectPath: string) => {
    try {
      const raw = await readFile(join(projectPath, 'CLAUDE.md'), 'utf-8')
      return parseClaudeMd(raw)
    } catch {
      return null
    }
  })

  ipcMain.handle(IPC.CLAUDE_MD_WRITE, async (_event, projectPath: string, config: ClaudeMdConfig) => {
    const content = serializeClaudeMd(config)
    await writeFile(join(projectPath, 'CLAUDE.md'), content, 'utf-8')
  })

  // ── Agents ──

  ipcMain.handle(IPC.AGENTS_LIST, async (_event, projectPath: string) => listAgents(projectPath))
  ipcMain.handle(IPC.AGENTS_SAVE, async (_event, projectPath: string, agent: AgentConfig) => saveAgent(projectPath, agent))
  ipcMain.handle(IPC.AGENTS_DELETE, async (_event, projectPath: string, fileName: string) => deleteAgent(projectPath, fileName))
  ipcMain.handle(IPC.AGENTS_RENAME, async (_event, projectPath: string, oldName: string, newName: string) => renameAgent(projectPath, oldName, newName))

  // ── Commands ──

  ipcMain.handle(IPC.COMMANDS_LIST, async (_event, projectPath: string) => listCommands(projectPath))
  ipcMain.handle(IPC.COMMANDS_SAVE, async (_event, projectPath: string, command: CommandConfig) => saveCommand(projectPath, command))
  ipcMain.handle(IPC.COMMANDS_DELETE, async (_event, projectPath: string, fileName: string) => deleteCommand(projectPath, fileName))

  // ── Skills ──

  ipcMain.handle(IPC.SKILLS_LIST, async (_event, projectPath: string) => listSkills(projectPath))
  ipcMain.handle(IPC.SKILLS_SAVE, async (_event, projectPath: string, skill: SkillConfig) => saveSkill(projectPath, skill))
  ipcMain.handle(IPC.SKILLS_DELETE, async (_event, projectPath: string, dirName: string) => deleteSkill(projectPath, dirName))

  // ── Settings ──

  ipcMain.handle(IPC.SETTINGS_READ, async (_event, projectPath: string) => readSettings(projectPath))
  ipcMain.handle(IPC.SETTINGS_WRITE, async (_event, projectPath: string, settings: SettingsConfig) => writeSettings(projectPath, settings))

  // ── MCP ──

  ipcMain.handle(IPC.MCP_LIST, async () => listMcpServers())

  // ── Claude CLI ──

  ipcMain.handle(IPC.CLAUDE_CHECK_INSTALLED, () => isClaudeInstalled())
  ipcMain.handle(IPC.CLAUDE_GET_VERSION, () => getClaudeVersion())

  // ── App / Dialog ──

  ipcMain.handle(IPC.APP_GET_PATH, (_event, name: string) => app.getPath(name as Parameters<typeof app.getPath>[0]))
  ipcMain.handle(IPC.DIALOG_OPEN_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory', 'createDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })

  app.on('before-quit', () => disposeAll())
}
