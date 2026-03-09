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

  // Presets
  PRESETS_LIST: 'presets:list',
  PRESETS_APPLY: 'presets:apply',
  PRESETS_EXPORT: 'presets:export',
  PRESETS_IMPORT: 'presets:import',

  // MCP management
  MCP_ADD: 'mcp:add',
  MCP_REMOVE: 'mcp:remove',

  // Workflow
  WORKFLOW_START: 'workflow:start',
  WORKFLOW_APPROVE: 'workflow:approve',
  WORKFLOW_SKIP: 'workflow:skip',
  WORKFLOW_STOP: 'workflow:stop',
  WORKFLOW_GET_STATE: 'workflow:get-state',
  WORKFLOW_STATE: 'workflow:state',
  WORKFLOW_OUTPUT: 'workflow:output',

  // Knowledge DB
  KNOWLEDGE_ADD: 'knowledge:add',
  KNOWLEDGE_SEARCH: 'knowledge:search',
  KNOWLEDGE_DELETE: 'knowledge:delete',
  KNOWLEDGE_UPDATE: 'knowledge:update',
  KNOWLEDGE_IMPORT_LESSONS: 'knowledge:import-lessons',
  KNOWLEDGE_GET_ESCALATION: 'knowledge:get-escalation',
  KNOWLEDGE_APPLY_ESCALATION: 'knowledge:apply-escalation',

  // Agent Team
  TEAM_START: 'team:start',
  TEAM_STOP: 'team:stop',
  TEAM_GET_STATE: 'team:get-state',
  TEAM_STATE: 'team:state',
  TEAM_OUTPUT: 'team:output',

  // Git
  GIT_LOG: 'git:log',
  GIT_DIFF_STAT: 'git:diff-stat',

  // App
  APP_GET_PATH: 'app:get-path',
  DIALOG_OPEN_DIRECTORY: 'dialog:open-directory'
} as const
