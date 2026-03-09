import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { getEscalationCandidates } from './knowledge-db'
import type { KnowledgeEntry } from './knowledge-db'

export interface EscalationResult {
  candidates: KnowledgeEntry[]
  applied: string[]
  skipped: string[]
}

export async function getEscalationReport(projectPath: string): Promise<EscalationResult> {
  const candidates = getEscalationCandidates(projectPath)

  // Check which ones are already in CLAUDE.md
  let claudeMd = ''
  try {
    claudeMd = await readFile(join(projectPath, 'CLAUDE.md'), 'utf-8')
  } catch {
    // no CLAUDE.md
  }

  const lower = claudeMd.toLowerCase()
  const applied: string[] = []
  const skipped: string[] = []

  for (const c of candidates) {
    if (lower.includes(c.title.toLowerCase())) {
      skipped.push(c.title)
    } else {
      applied.push(c.title)
    }
  }

  return { candidates, applied, skipped }
}

export async function applyEscalations(projectPath: string, entries: KnowledgeEntry[]): Promise<number> {
  const claudePath = join(projectPath, 'CLAUDE.md')
  let content = ''

  try {
    content = await readFile(claudePath, 'utf-8')
  } catch {
    content = `# Project Rules\n\n`
  }

  const lower = content.toLowerCase()
  const newRules: string[] = []

  for (const entry of entries) {
    if (lower.includes(entry.title.toLowerCase())) continue

    const ruleText = extractRule(entry)
    if (ruleText) newRules.push(ruleText)
  }

  if (newRules.length === 0) return 0

  // Find or create Forbidden Patterns section
  const forbiddenMatch = content.match(/^## (Forbidden Patterns|금지 패턴)/m)
  const codingRulesMatch = content.match(/^## (Coding Rules|코딩 규칙)/m)

  if (forbiddenMatch) {
    // Insert after the section header
    const idx = content.indexOf(forbiddenMatch[0]) + forbiddenMatch[0].length
    const nextSection = content.indexOf('\n## ', idx + 1)
    const insertPoint = nextSection > 0 ? nextSection : content.length
    const before = content.slice(0, insertPoint).trimEnd()
    const after = content.slice(insertPoint)

    const addedLines = newRules.map((r) => `- ${r} (auto-escalated, repeated 3+ times)`).join('\n')
    content = `${before}\n${addedLines}\n${after}`
  } else if (codingRulesMatch) {
    // Insert after coding rules section
    const idx = content.indexOf(codingRulesMatch[0]) + codingRulesMatch[0].length
    const nextSection = content.indexOf('\n## ', idx + 1)
    const insertPoint = nextSection > 0 ? nextSection : content.length
    const before = content.slice(0, insertPoint).trimEnd()
    const after = content.slice(insertPoint)

    const addedLines = '\n\n## Escalated Patterns\n\n' +
      newRules.map((r) => `- ${r} (auto-escalated, repeated 3+ times)`).join('\n')
    content = `${before}${addedLines}\n${after}`
  } else {
    // Append at the end
    content = content.trimEnd() + '\n\n## Escalated Patterns\n\n' +
      newRules.map((r) => `- ${r} (auto-escalated, repeated 3+ times)`).join('\n') + '\n'
  }

  await writeFile(claudePath, content, 'utf-8')
  return newRules.length
}

function extractRule(entry: KnowledgeEntry): string | null {
  // Try to extract a concise rule from the content
  const prevention = entry.content.match(/Prevention:\s*(.+)/i)
  if (prevention) return `${entry.title}: ${prevention[1].trim()}`

  const rootCause = entry.content.match(/Root cause:\s*(.+)/i)
  if (rootCause) return `Avoid: ${entry.title} (${rootCause[1].trim()})`

  return entry.title
}
