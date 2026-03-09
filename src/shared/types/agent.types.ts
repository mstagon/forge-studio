export interface AgentConfig {
  fileName: string
  displayName: string
  group: 'planning' | 'development' | 'review' | 'documentation' | 'custom'
  content: string
  filePath: string
}

export interface CommandConfig {
  fileName: string
  displayName: string
  content: string
  filePath: string
}

export interface SkillConfig {
  dirName: string
  displayName: string
  content: string
  filePath: string
}

export interface HookEntry {
  type: 'command'
  command: string
}

export interface HookMatcher {
  matcher?: string
  hooks: HookEntry[]
}

export interface HooksConfig {
  SessionStart?: HookMatcher[]
  PreToolUse?: HookMatcher[]
  PostToolUse?: HookMatcher[]
}

export interface SettingsConfig {
  model?: string
  effortLevel?: string
  permissions?: {
    allowedTools?: string[]
    deny?: string[]
  }
  hooks?: HooksConfig
}

export interface McpServerConfig {
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
}
