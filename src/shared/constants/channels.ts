export const IPC = {
  // Terminal / PTY
  TERMINAL_CREATE: 'terminal:create',
  TERMINAL_DATA: 'terminal:data',
  TERMINAL_RESIZE: 'terminal:resize',
  TERMINAL_DISPOSE: 'terminal:dispose',
  TERMINAL_ON_DATA: 'terminal:on-data',
  TERMINAL_ON_EXIT: 'terminal:on-exit',

  // Project
  PROJECT_OPEN: 'project:open',
  PROJECT_READ_DIR: 'project:read-dir',
  PROJECT_GET_RECENT: 'project:get-recent',

  // File system
  FS_READ_FILE: 'fs:read-file',
  FS_WRITE_FILE: 'fs:write-file',
  FS_FILE_CHANGED: 'fs:file-changed',

  // Claude CLI
  CLAUDE_CHECK_INSTALLED: 'claude:check-installed',
  CLAUDE_GET_VERSION: 'claude:get-version',

  // App
  APP_GET_PATH: 'app:get-path',
  DIALOG_OPEN_DIRECTORY: 'dialog:open-directory'
} as const
