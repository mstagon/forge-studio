import { readdir, readFile, writeFile, mkdir, rm, rename } from 'fs/promises'
import { join, basename } from 'path'
import type { AgentConfig, CommandConfig, SkillConfig, SettingsConfig, McpServerConfig } from '../../shared/types/agent.types'

// ── Agents ──

export async function listAgents(projectPath: string): Promise<AgentConfig[]> {
  const dir = join(projectPath, '.claude', 'agents')
  try {
    const files = await readdir(dir)
    const agents: AgentConfig[] = []
    for (const file of files) {
      if (!file.endsWith('.md')) continue
      const filePath = join(dir, file)
      const content = await readFile(filePath, 'utf-8')
      const name = file.replace('.md', '')
      agents.push({
        fileName: name,
        displayName: formatDisplayName(name),
        group: inferAgentGroup(name, content),
        content,
        filePath,
        isActive: true
      })
    }
    return agents.sort((a, b) => groupOrder(a.group) - groupOrder(b.group))
  } catch {
    return []
  }
}

export async function saveAgent(projectPath: string, agent: AgentConfig): Promise<void> {
  const dir = join(projectPath, '.claude', 'agents')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, `${agent.fileName}.md`), agent.content, 'utf-8')
}

export async function deleteAgent(projectPath: string, fileName: string): Promise<void> {
  const filePath = join(projectPath, '.claude', 'agents', `${fileName}.md`)
  await rm(filePath)
}

export async function renameAgent(projectPath: string, oldName: string, newName: string): Promise<void> {
  const dir = join(projectPath, '.claude', 'agents')
  await rename(join(dir, `${oldName}.md`), join(dir, `${newName}.md`))
}

// ── Commands ──

export async function listCommands(projectPath: string): Promise<CommandConfig[]> {
  const dir = join(projectPath, '.claude', 'commands')
  try {
    const files = await readdir(dir)
    const commands: CommandConfig[] = []
    for (const file of files) {
      if (!file.endsWith('.md')) continue
      const filePath = join(dir, file)
      const content = await readFile(filePath, 'utf-8')
      const name = file.replace('.md', '')
      commands.push({
        fileName: name,
        displayName: formatDisplayName(name),
        content,
        filePath
      })
    }
    return commands.sort((a, b) => a.displayName.localeCompare(b.displayName))
  } catch {
    return []
  }
}

export async function saveCommand(projectPath: string, command: CommandConfig): Promise<void> {
  const dir = join(projectPath, '.claude', 'commands')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, `${command.fileName}.md`), command.content, 'utf-8')
}

export async function deleteCommand(projectPath: string, fileName: string): Promise<void> {
  const filePath = join(projectPath, '.claude', 'commands', `${fileName}.md`)
  await rm(filePath)
}

// ── Skills ──

export async function listSkills(projectPath: string): Promise<SkillConfig[]> {
  const dir = join(projectPath, '.claude', 'skills')
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    const skills: SkillConfig[] = []
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const skillPath = join(dir, entry.name, 'SKILL.md')
      try {
        const content = await readFile(skillPath, 'utf-8')
        skills.push({
          dirName: entry.name,
          displayName: formatDisplayName(entry.name),
          content,
          filePath: skillPath
        })
      } catch {
        // SKILL.md doesn't exist
      }
    }
    return skills.sort((a, b) => a.displayName.localeCompare(b.displayName))
  } catch {
    return []
  }
}

export async function saveSkill(projectPath: string, skill: SkillConfig): Promise<void> {
  const dir = join(projectPath, '.claude', 'skills', skill.dirName)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'SKILL.md'), skill.content, 'utf-8')
}

export async function deleteSkill(projectPath: string, dirName: string): Promise<void> {
  const dir = join(projectPath, '.claude', 'skills', dirName)
  await rm(dir, { recursive: true })
}

// ── Settings (settings.json) ──

export async function readSettings(projectPath: string): Promise<SettingsConfig> {
  try {
    const raw = await readFile(join(projectPath, '.claude', 'settings.json'), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function writeSettings(projectPath: string, settings: SettingsConfig): Promise<void> {
  const dir = join(projectPath, '.claude')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'settings.json'), JSON.stringify(settings, null, 2), 'utf-8')
}

// ── MCP Servers ──

export async function listMcpServers(): Promise<McpServerConfig[]> {
  try {
    const home = process.env.HOME || ''
    const raw = await readFile(join(home, '.claude.json'), 'utf-8')
    const config = JSON.parse(raw)
    const servers: McpServerConfig[] = []
    const mcpServers = config.mcpServers || {}
    for (const [name, value] of Object.entries(mcpServers)) {
      const v = value as { command?: string; args?: string[]; env?: Record<string, string> }
      servers.push({
        name,
        command: v.command || '',
        args: v.args || [],
        env: v.env
      })
    }
    return servers
  } catch {
    return []
  }
}

// ── Helpers ──

function formatDisplayName(fileName: string): string {
  return fileName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function inferAgentGroup(name: string, content: string): AgentConfig['group'] {
  const lower = name.toLowerCase() + ' ' + content.slice(0, 500).toLowerCase()
  if (lower.includes('planner') || lower.includes('architect') || lower.includes('decompos')) return 'planning'
  if (lower.includes('review') || lower.includes('audit') || lower.includes('verif') || lower.includes('security')) return 'review'
  if (lower.includes('doc-writer') || lower.includes('document')) return 'documentation'
  if (lower.includes('ui') || lower.includes('logic') || lower.includes('backend') || lower.includes('test') || lower.includes('implement')) return 'development'
  return 'custom'
}

function groupOrder(group: AgentConfig['group']): number {
  const order = { planning: 0, development: 1, review: 2, documentation: 3, custom: 4 }
  return order[group]
}
