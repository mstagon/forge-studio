export interface ForgeProject {
  id: string
  name: string
  path: string
  techStack?: string
  hasClaudeMd: boolean
  hasClaudeDir: boolean
  lastOpenedAt: string
}

export interface ProjectStats {
  agentCount: number
  commandCount: number
  skillCount: number
  mcpServerCount: number
  branch?: string
  lastCommit?: string
}
