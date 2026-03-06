import { ipcMain, dialog, app, BrowserWindow } from 'electron'
import { IPC } from '../../shared/constants/channels'
import { createPtySession, writeToPty, resizePty, disposePty, onPtyData, onPtyExit, disposeAll } from '../services/pty-manager'
import { isClaudeInstalled, getClaudeVersion } from '../services/claude-bridge'
import { openProject, getProjectStats, readProjectFile, listDirectory } from '../services/project-manager'
import { readFile, writeFile } from 'fs/promises'

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // ── Terminal / PTY ──

  ipcMain.handle(IPC.TERMINAL_CREATE, async (_event, cwd: string) => {
    const id = createPtySession(cwd)

    onPtyData(id, (data) => {
      mainWindow.webContents.send(IPC.TERMINAL_ON_DATA, id, data)
    })

    onPtyExit(id, (exitCode) => {
      mainWindow.webContents.send(IPC.TERMINAL_ON_EXIT, id, exitCode)
    })

    return id
  })

  ipcMain.on(IPC.TERMINAL_DATA, (_event, id: string, data: string) => {
    writeToPty(id, data)
  })

  ipcMain.on(IPC.TERMINAL_RESIZE, (_event, id: string, cols: number, rows: number) => {
    resizePty(id, cols, rows)
  })

  ipcMain.on(IPC.TERMINAL_DISPOSE, (_event, id: string) => {
    disposePty(id)
  })

  // ── Project ──

  ipcMain.handle(IPC.PROJECT_OPEN, async (_event, projectPath: string) => {
    const project = await openProject(projectPath)
    const stats = await getProjectStats(projectPath)
    return { project, stats }
  })

  ipcMain.handle(IPC.PROJECT_READ_DIR, async (_event, dirPath: string) => {
    return listDirectory(dirPath)
  })

  // ── File System ──

  ipcMain.handle(IPC.FS_READ_FILE, async (_event, filePath: string) => {
    return readFile(filePath, 'utf-8')
  })

  ipcMain.handle(IPC.FS_WRITE_FILE, async (_event, filePath: string, content: string) => {
    await writeFile(filePath, content, 'utf-8')
  })

  // ── Claude CLI ──

  ipcMain.handle(IPC.CLAUDE_CHECK_INSTALLED, () => {
    return isClaudeInstalled()
  })

  ipcMain.handle(IPC.CLAUDE_GET_VERSION, () => {
    return getClaudeVersion()
  })

  // ── App / Dialog ──

  ipcMain.handle(IPC.APP_GET_PATH, (_event, name: string) => {
    return app.getPath(name as Parameters<typeof app.getPath>[0])
  })

  ipcMain.handle(IPC.DIALOG_OPEN_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  // Cleanup on quit
  app.on('before-quit', () => {
    disposeAll()
  })
}
