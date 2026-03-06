import { watch } from 'chokidar'
import { BrowserWindow } from 'electron'
import { IPC } from '../../shared/constants/channels'
import type { FSWatcher } from 'chokidar'

let watcher: FSWatcher | null = null

export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink'
  path: string
}

export function startWatching(projectPath: string, mainWindow: BrowserWindow): void {
  stopWatching()

  watcher = watch(
    [
      `${projectPath}/CLAUDE.md`,
      `${projectPath}/.claude/**/*`
    ],
    {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
      ignored: /(^|[\/\\])\../  // ignore dotfiles inside .claude
    }
  )

  const emit = (type: FileChangeEvent['type'], path: string): void => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC.FS_FILE_CHANGED, { type, path })
    }
  }

  watcher.on('add', (path) => emit('add', path))
  watcher.on('change', (path) => emit('change', path))
  watcher.on('unlink', (path) => emit('unlink', path))
}

export function stopWatching(): void {
  if (watcher) {
    watcher.close()
    watcher = null
  }
}
