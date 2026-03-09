export interface TechStackPreset {
  id: string
  name: string
  description: string
  icon: string
  category: 'mobile' | 'web' | 'backend' | 'fullstack' | 'custom'
  stack: {
    language: string
    framework: string
    stateManagement?: string
    backend?: string
    router?: string
    database?: string
    styling?: string
    packages?: string[]
  }
  architecture: {
    pattern: string
    structure: string
    reference?: string
  }
  build: {
    setup: string
    analyze?: string
    test?: string
    format?: string
    codegen?: string
  }
  codingRules: string[]
  forbiddenPatterns: string[]
  agents: PresetAgent[]
  commands: PresetCommand[]
  skills: PresetSkill[]
  hooks: {
    PostToolUse?: PresetHook[]
    PreToolUse?: PresetHook[]
    SessionStart?: PresetHook[]
  }
  recommendedMcp: PresetMcp[]
}

export interface PresetAgent {
  fileName: string
  content: string
}

export interface PresetCommand {
  fileName: string
  content: string
}

export interface PresetSkill {
  dirName: string
  content: string
}

export interface PresetHook {
  matcher?: string
  command: string
}

export interface PresetMcp {
  name: string
  command: string
  args: string[]
  required: boolean
}
