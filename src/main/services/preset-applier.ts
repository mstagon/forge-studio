import { mkdir, writeFile, readFile } from 'fs/promises'
import { join } from 'path'
import type { TechStackPreset } from '../../shared/types/preset.types'

export async function applyPreset(projectPath: string, preset: TechStackPreset): Promise<void> {
  // Ensure directories exist
  const dirs = [
    join(projectPath, '.claude', 'agents'),
    join(projectPath, '.claude', 'commands'),
    join(projectPath, '.claude', 'skills'),
    join(projectPath, 'docs', 'prd'),
    join(projectPath, 'docs', 'specs'),
    join(projectPath, 'docs', 'templates')
  ]

  for (const dir of dirs) {
    await mkdir(dir, { recursive: true })
  }

  // Generate CLAUDE.md
  const claudeMd = generateClaudeMd(preset)
  await writeFile(join(projectPath, 'CLAUDE.md'), claudeMd, 'utf-8')

  // Write agents (.md extension required for config-manager to find them)
  for (const agent of preset.agents) {
    const fileName = agent.fileName.endsWith('.md') ? agent.fileName : `${agent.fileName}.md`
    await writeFile(join(projectPath, '.claude', 'agents', fileName), agent.content, 'utf-8')
  }

  // Write commands (.md extension required for config-manager to find them)
  for (const command of preset.commands) {
    const fileName = command.fileName.endsWith('.md') ? command.fileName : `${command.fileName}.md`
    await writeFile(join(projectPath, '.claude', 'commands', fileName), command.content, 'utf-8')
  }

  // Write skills
  for (const skill of preset.skills) {
    const skillDir = join(projectPath, '.claude', 'skills', skill.dirName)
    await mkdir(skillDir, { recursive: true })
    await writeFile(join(skillDir, 'SKILL.md'), skill.content, 'utf-8')
  }

  // Write settings.json (hooks + permissions)
  const settings = generateSettings(preset)
  await writeFile(join(projectPath, '.claude', 'settings.json'), JSON.stringify(settings, null, 2), 'utf-8')

  // Write PRD template
  await writeFile(join(projectPath, 'docs', 'templates', 'prd-template.md'), PRD_TEMPLATE, 'utf-8')

  // Write spec template
  await writeFile(join(projectPath, 'docs', 'templates', 'spec-template.md'), SPEC_TEMPLATE, 'utf-8')

  // Install recommended MCP servers to ~/.claude.json
  if (preset.recommendedMcp?.length) {
    const home = process.env.HOME || ''
    const configPath = join(home, '.claude.json')
    let config: Record<string, unknown> = {}
    try {
      const raw = await readFile(configPath, 'utf-8')
      config = JSON.parse(raw)
    } catch {
      // file doesn't exist yet
    }
    if (!config.mcpServers) config.mcpServers = {}
    const servers = config.mcpServers as Record<string, unknown>
    for (const mcp of preset.recommendedMcp) {
      if (!servers[mcp.name]) {
        servers[mcp.name] = { command: mcp.command, args: mcp.args }
      }
    }
    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
  }
}

function generateClaudeMd(preset: TechStackPreset): string {
  const lines: string[] = []

  lines.push(`# ${preset.name}`)
  lines.push('')
  lines.push(preset.description)
  lines.push('')

  // Tech Stack
  lines.push('## Tech Stack')
  lines.push('')
  lines.push(`- Language: ${preset.stack.language}`)
  lines.push(`- Framework: ${preset.stack.framework}`)
  if (preset.stack.stateManagement) lines.push(`- State Management: ${preset.stack.stateManagement}`)
  if (preset.stack.backend) lines.push(`- Backend: ${preset.stack.backend}`)
  if (preset.stack.router) lines.push(`- Router: ${preset.stack.router}`)
  if (preset.stack.database) lines.push(`- Database: ${preset.stack.database}`)
  if (preset.stack.styling) lines.push(`- Styling: ${preset.stack.styling}`)
  if (preset.stack.packages?.length) {
    lines.push(`- Key Packages: ${preset.stack.packages.join(', ')}`)
  }
  lines.push('')

  // Architecture
  lines.push('## Architecture')
  lines.push('')
  lines.push(`- Pattern: ${preset.architecture.pattern}`)
  lines.push(`- Structure: ${preset.architecture.structure}`)
  if (preset.architecture.reference) lines.push(`- Reference: ${preset.architecture.reference}`)
  lines.push('')

  // Build & Dev
  lines.push('## Build & Dev')
  lines.push('')
  lines.push('```')
  lines.push(preset.build.setup)
  if (preset.build.analyze) lines.push(preset.build.analyze)
  if (preset.build.test) lines.push(preset.build.test)
  if (preset.build.format) lines.push(preset.build.format)
  if (preset.build.codegen) lines.push(preset.build.codegen)
  lines.push('```')
  lines.push('')

  // Coding Rules
  lines.push('## Coding Rules')
  lines.push('')
  for (const rule of preset.codingRules) {
    lines.push(`- ${rule}`)
  }
  lines.push('')

  // Forbidden Patterns
  lines.push('## Forbidden Patterns')
  lines.push('')
  for (const pattern of preset.forbiddenPatterns) {
    lines.push(`- ${pattern}`)
  }
  lines.push('')

  // Evidence-based
  lines.push('## Evidence-based Principle')
  lines.push('')
  lines.push('- Always verify API usage with context7 MCP before implementing')
  lines.push('- Do not guess. Verify then write.')
  lines.push('- Record mistakes in docs/lessons-learned.md')
  lines.push('')

  return lines.join('\n')
}

function generateSettings(preset: TechStackPreset): Record<string, unknown> {
  const settings: Record<string, unknown> = {}

  // Hooks
  if (preset.hooks.PostToolUse?.length || preset.hooks.PreToolUse?.length || preset.hooks.SessionStart?.length) {
    const hooks: Record<string, unknown[]> = {}

    if (preset.hooks.PreToolUse?.length) {
      hooks.PreToolUse = preset.hooks.PreToolUse.map((h) => ({
        ...(h.matcher ? { matcher: h.matcher } : {}),
        hooks: [{ type: 'command' as const, command: h.command }]
      }))
    }

    if (preset.hooks.PostToolUse?.length) {
      hooks.PostToolUse = preset.hooks.PostToolUse.map((h) => ({
        ...(h.matcher ? { matcher: h.matcher } : {}),
        hooks: [{ type: 'command' as const, command: h.command }]
      }))
    }

    if (preset.hooks.SessionStart?.length) {
      hooks.SessionStart = preset.hooks.SessionStart.map((h) => ({
        hooks: [{ type: 'command' as const, command: h.command }]
      }))
    }

    settings.hooks = hooks
  }

  // Permissions
  settings.permissions = {
    allowedTools: ['Read', 'Write', 'Edit', 'Bash(npm run *)', 'Bash(git *)'],
    deny: ['Bash(rm -rf *)']
  }

  return settings
}

const PRD_TEMPLATE = `# PRD: {Feature Name}

## 1. Background
Why this feature is needed.

## 2. Target Users
Who will use this feature and their goals.

## 3. User Stories
- As a [user type], I want to [action] so that [benefit].

## 4. Functional Requirements
### 4.1 Core
- [ ] Requirement 1
- [ ] Requirement 2

### 4.2 Edge Cases
- [ ] Edge case 1

## 5. Non-Functional Requirements
- Performance: ...
- Security: ...
- Accessibility: ...

## 6. Success Metrics
- Metric 1: ...

## 7. Out of Scope
- ...

## 8. Open Questions
- ...
`

const SPEC_TEMPLATE = `# Technical Spec: {Feature Name}

## 1. Overview
Brief technical summary.

## 2. Architecture
### 2.1 Components
Describe the components involved.

### 2.2 Data Flow
How data flows through the system.

## 3. Data Models
\`\`\`
Model definitions
\`\`\`

## 4. API Contracts
### Endpoint 1
- Method: GET/POST
- Path: /api/...
- Request/Response schema

## 5. State Management
How state is managed.

## 6. Error Handling
Error scenarios and their handling.

## 7. Test Strategy
### Unit Tests
- ...
### Integration Tests
- ...

## 8. Migration / Rollback
- ...
`
