import { ipcMain, dialog, app, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { IPC } from '../../shared/constants/channels'
import { createPtySession, writeToPty, resizePty, disposePty, onPtyData, onPtyExit, disposeAll } from '../services/pty-manager'
import { isClaudeInstalled, getClaudeVersion } from '../services/claude-bridge'
import { openProject, getProjectStats, listDirectory, getGitLog, getGitDiffStat } from '../services/project-manager'
import { parseClaudeMd, serializeClaudeMd } from '../services/claude-md-parser'
import { listAgents, saveAgent, deleteAgent, renameAgent, listCommands, saveCommand, deleteCommand, listSkills, saveSkill, deleteSkill, readSettings, writeSettings, listMcpServers, addMcpServer, removeMcpServer } from '../services/config-manager'
import { startWatching } from '../services/file-watcher'
import { listPresets, getPreset, addUserPreset } from '../services/preset-registry'
import { applyPreset } from '../services/preset-applier'
import { exportProjectAsPreset } from '../services/preset-exporter'
import { initWorkflowRunner, startWorkflow, approveGate, skipStep, stopWorkflow, getWorkflowState } from '../services/workflow-runner'
import { addKnowledge, searchKnowledge, deleteKnowledge, updateKnowledge, importLessonsFromFile, closeDb } from '../services/knowledge-db'
import { getEscalationReport, applyEscalations } from '../services/escalation'
import { initAgentTeam, startTeam, stopTeam, getTeamState } from '../services/agent-team'
import type { WorkflowStepDef } from '../services/workflow-runner'
import type { KnowledgeEntry } from '../services/knowledge-db'
import type { AgentConfig, CommandConfig, SkillConfig, SettingsConfig } from '../../shared/types/agent.types'
import type { ClaudeMdConfig } from '../../shared/types/claude-md.types'

let _mainWindow: BrowserWindow

export function updateMainWindow(win: BrowserWindow): void {
  _mainWindow = win
  initWorkflowRunner(win)
  initAgentTeam(win)
}

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  _mainWindow = mainWindow
  initWorkflowRunner(mainWindow)
  initAgentTeam(mainWindow)

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
  ipcMain.handle(IPC.MCP_ADD, async (_event, name: string, command: string, args: string[], env?: Record<string, string>) => {
    await addMcpServer(name, command, args, env)
  })
  ipcMain.handle(IPC.MCP_REMOVE, async (_event, name: string) => {
    await removeMcpServer(name)
  })

  // ── Claude CLI ──

  ipcMain.handle(IPC.CLAUDE_CHECK_INSTALLED, () => isClaudeInstalled())
  ipcMain.handle(IPC.CLAUDE_GET_VERSION, () => getClaudeVersion())

  // ── Presets ──

  ipcMain.handle(IPC.PRESETS_LIST, () => listPresets())
  ipcMain.handle(IPC.PRESETS_APPLY, async (_event, projectPath: string, presetId: string) => {
    const preset = getPreset(presetId)
    if (!preset) throw new Error(`Preset not found: ${presetId}`)
    await applyPreset(projectPath, preset)
    return true
  })
  ipcMain.handle(IPC.PRESETS_EXPORT, async (_event, projectPath: string, meta: { name: string; description: string; icon: string; category: string }) => {
    return exportProjectAsPreset(projectPath, meta as Parameters<typeof exportProjectAsPreset>[1])
  })
  ipcMain.handle(IPC.PRESETS_IMPORT, async (_event, presetJson: string) => {
    const preset = JSON.parse(presetJson)
    addUserPreset(preset)
    return true
  })

  // ── Workflow ──

  ipcMain.handle(IPC.WORKFLOW_START, async (_event, projectPath: string, steps: WorkflowStepDef[]) => {
    return startWorkflow(projectPath, steps)
  })
  ipcMain.handle(IPC.WORKFLOW_APPROVE, async (_event, projectPath: string) => approveGate(projectPath))
  ipcMain.handle(IPC.WORKFLOW_SKIP, async (_event, projectPath: string) => skipStep(projectPath))
  ipcMain.handle(IPC.WORKFLOW_STOP, async () => stopWorkflow())
  ipcMain.handle(IPC.WORKFLOW_GET_STATE, async () => getWorkflowState())

  // ── Knowledge DB ──

  ipcMain.handle(IPC.KNOWLEDGE_ADD, async (_event, entry: { projectPath: string; category: string; title: string; content: string; tags: string[] }) => {
    return addKnowledge(entry as Parameters<typeof addKnowledge>[0])
  })
  ipcMain.handle(IPC.KNOWLEDGE_SEARCH, async (_event, query: { projectPath?: string; category?: string; search?: string; limit?: number; offset?: number }) => {
    return searchKnowledge(query as Parameters<typeof searchKnowledge>[0])
  })
  ipcMain.handle(IPC.KNOWLEDGE_DELETE, async (_event, id: number) => deleteKnowledge(id))
  ipcMain.handle(IPC.KNOWLEDGE_UPDATE, async (_event, id: number, updates: { title?: string; content?: string; tags?: string[]; category?: string }) => {
    updateKnowledge(id, updates)
  })
  ipcMain.handle(IPC.KNOWLEDGE_IMPORT_LESSONS, async (_event, projectPath: string, content: string) => {
    return importLessonsFromFile(projectPath, content)
  })
  ipcMain.handle(IPC.KNOWLEDGE_GET_ESCALATION, async (_event, projectPath: string) => {
    return getEscalationReport(projectPath)
  })
  ipcMain.handle(IPC.KNOWLEDGE_APPLY_ESCALATION, async (_event, projectPath: string, entries: KnowledgeEntry[]) => {
    return applyEscalations(projectPath, entries)
  })

  // ── Agent Team ──

  ipcMain.handle(IPC.TEAM_START, async (_event, projectPath: string, featureName: string) => {
    return startTeam(projectPath, featureName)
  })
  ipcMain.handle(IPC.TEAM_STOP, async () => stopTeam())
  ipcMain.handle(IPC.TEAM_GET_STATE, async () => getTeamState())

  // ── Git ──

  ipcMain.handle(IPC.GIT_LOG, async (_event, projectPath: string, count?: number) => {
    return getGitLog(projectPath, count)
  })
  ipcMain.handle(IPC.GIT_DIFF_STAT, async (_event, projectPath: string) => {
    return getGitDiffStat(projectPath)
  })

  // ── App / Dialog ──

  ipcMain.handle(IPC.APP_GET_PATH, (_event, name: string) => app.getPath(name as Parameters<typeof app.getPath>[0]))
  ipcMain.handle(IPC.DIALOG_OPEN_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory', 'createDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })

  app.on('before-quit', () => {
    disposeAll()
    closeDb()
  })
}
