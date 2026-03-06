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
  FS_START_WATCHING: 'fs:start-watching',

  // CLAUDE.md
  CLAUDE_MD_READ: 'claude-md:read',
  CLAUDE_MD_WRITE: 'claude-md:write',

  // Agents
  AGENTS_LIST: 'agents:list',
  AGENTS_SAVE: 'agents:save',
  AGENTS_DELETE: 'agents:delete',
  AGENTS_RENAME: 'agents:rename',

  // Commands
  COMMANDS_LIST: 'commands:list',
  COMMANDS_SAVE: 'commands:save',
  COMMANDS_DELETE: 'commands:delete',

  // Skills
  SKILLS_LIST: 'skills:list',
  SKILLS_SAVE: 'skills:save',
  SKILLS_DELETE: 'skills:delete',

  // Settings (hooks, permissions)
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',

  // MCP
  MCP_LIST: 'mcp:list',

  // Claude CLI
  CLAUDE_CHECK_INSTALLED: 'claude:check-installed',
  CLAUDE_GET_VERSION: 'claude:get-version',

  // App
  APP_GET_PATH: 'app:get-path',
  DIALOG_OPEN_DIRECTORY: 'dialog:open-directory'
} as const
