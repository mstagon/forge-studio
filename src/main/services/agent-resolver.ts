import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

export interface AgentInfo {
  name: string
  group: 'planning' | 'development' | 'review' | 'documentation' | 'custom'
  content: string
}

function inferGroup(name: string, content: string): AgentInfo['group'] {
  const lower = name.toLowerCase() + ' ' + content.slice(0, 500).toLowerCase()
  if (lower.includes('planner') || lower.includes('architect') || lower.includes('decompos') || lower.includes('strategist')) return 'planning'
  if (lower.includes('review') || lower.includes('audit') || lower.includes('verif') || lower.includes('security')) return 'review'
  if (lower.includes('doc-writer') || lower.includes('document')) return 'documentation'
  if (lower.includes('ui') || lower.includes('logic') || lower.includes('backend') || lower.includes('test') || lower.includes('implement') || lower.includes('writer')) return 'development'
  return 'custom'
}

export async function loadAllAgents(projectPath: string): Promise<AgentInfo[]> {
  const dir = join(projectPath, '.claude', 'agents')
  const agents: AgentInfo[] = []
  try {
    const files = await readdir(dir)
    for (const file of files) {
      if (!file.endsWith('.md') || file.startsWith('.')) continue
      try {
        const content = await readFile(join(dir, file), 'utf-8')
        const name = file.replace('.md', '')
        agents.push({ name, group: inferGroup(name, content), content })
      } catch { /* skip unreadable */ }
    }
  } catch { /* agents dir doesn't exist */ }
  return agents
}

export function matchAgentsForStep(stepName: string, stepCommand: string, agents: AgentInfo[]): AgentInfo[] {
  const lower = (stepName + ' ' + stepCommand).toLowerCase()
  const matched: AgentInfo[] = []

  // Implement/Build → all development agents
  if (/implement|build|develop|code|feature|creat/.test(lower)) {
    matched.push(...agents.filter((a) => a.group === 'development'))
  }

  // Review/Audit → all review agents
  if (/review|audit|security|check|quality|inspect/.test(lower)) {
    matched.push(...agents.filter((a) => a.group === 'review'))
  }

  // Test → test-related development agents + review agents
  if (/\btest\b/.test(lower)) {
    matched.push(...agents.filter((a) =>
      (a.group === 'development' && /test/i.test(a.name)) ||
      a.group === 'review'
    ))
  }

  // Document → documentation agents
  if (/document|readme|changelog/.test(lower)) {
    matched.push(...agents.filter((a) => a.group === 'documentation'))
  }

  // Deduplicate by name
  const seen = new Set<string>()
  return matched.filter((a) => {
    if (seen.has(a.name)) return false
    seen.add(a.name)
    return true
  })
}

export function matchAgentsForRole(agentName: string, agents: AgentInfo[]): AgentInfo[] {
  // Primary: exact name match
  const exact = agents.find((a) => a.name === agentName)
  if (exact) return [exact]

  // Fallback: match by group inferred from the role name
  const group = inferGroup(agentName, '')
  if (group !== 'custom') {
    return agents.filter((a) => a.group === group)
  }

  return []
}

export function buildAgentContext(matched: AgentInfo[]): string {
  if (matched.length === 0) return ''
  const sections = matched.map((a) =>
    `[Agent: ${a.name}]\n${a.content}`
  ).join('\n\n')
  return sections
}
