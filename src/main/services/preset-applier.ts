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

  // ── Header ──
  lines.push(`# ${preset.name}`)
  lines.push('')
  lines.push(preset.description)
  lines.push('')

  // ── Reasoning ──
  lines.push('## Reasoning')
  lines.push('')
  lines.push('Think step by step for every task:')
  lines.push('1. Read relevant files and understand existing code before making changes')
  lines.push('2. Identify implicit requirements, edge cases, and preconditions')
  lines.push('3. Verify assumptions against actual source code — not documentation alone')
  lines.push('4. Challenge the obvious approach: "What would make this wrong?"')
  lines.push('5. After implementation, verify end-to-end behavior — not just the changed file')
  lines.push('')
  lines.push('BLOCK: No implementation until steps 1-4 complete. Intuition is not a premise.')
  lines.push('')

  // ── Routing ──
  lines.push('## Routing')
  lines.push('')
  lines.push('Every request → check ALL conditions (not first-match):')
  lines.push('')
  lines.push('  □ New feature / planning?')
  lines.push('    → Read `.claude/agents/product-planner.md`, follow `docs/templates/prd-template.md`')
  lines.push('  □ Technical design / architecture?')
  lines.push('    → Read `.claude/agents/tech-architect.md`, follow `docs/templates/spec-template.md`')
  lines.push('  □ Implementation task?')
  lines.push('    → List `.claude/agents/` for stack-specific agents, read spec from `docs/specs/` first')
  lines.push('  □ Multi-step or complex task?')
  lines.push('    → Read `.claude/agents/task-decomposer.md`, break into ordered subtasks before starting')
  lines.push('  □ Code review / quality check?')
  lines.push('    → Read `.claude/agents/code-reviewer.md`, check `docs/lessons-learned.md` for past mistakes')
  lines.push('  □ Security concern?')
  lines.push('    → Read `.claude/agents/security-auditor.md`')
  lines.push('  □ Documentation / changelog?')
  lines.push('    → Read `.claude/agents/doc-writer.md`')
  lines.push('  □ External API / unknown package?')
  lines.push('    → Use `context7` MCP to verify before writing any code')
  lines.push('  □ Recurring problem / seen before?')
  lines.push('    → Query Knowledge DB and `docs/lessons-learned.md` first')
  lines.push('  □ Slash command exists for this?')
  lines.push('    → Check `.claude/commands/` — use existing command instead of ad-hoc prompt')
  lines.push('  □ Skill available?')
  lines.push('    → Check `.claude/skills/` — reuse skill instead of reimplementing')
  lines.push('  □ Destructive or irreversible action?')
  lines.push('    → Stop and confirm with user before proceeding')
  lines.push('')
  lines.push('If no agent file exists for a matched condition, skip that route — do not hallucinate agents.')
  lines.push('')

  // ── Tech Stack ──
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

  // ── Architecture ──
  lines.push('## Architecture')
  lines.push('')
  lines.push(`- Pattern: ${preset.architecture.pattern}`)
  lines.push(`- Structure: ${preset.architecture.structure}`)
  if (preset.architecture.reference) lines.push(`- Reference: ${preset.architecture.reference}`)
  lines.push('')

  // ── Build & Dev ──
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

  // ── Harness Framework ──
  lines.push('## Harness Framework')
  lines.push('')
  lines.push('This project is managed by Forge Studio. The following structures are available.')
  lines.push('')
  lines.push('### Agents (`.claude/agents/`)')
  lines.push('Specialized AI personas. Each `.md` file defines a role, rules, and output format.')
  lines.push('- Before starting a complex task, list `.claude/agents/` to discover available specialists')
  lines.push('- Agents are auto-matched to workflow steps by keyword (implement→development, review→review, test→QA)')
  lines.push('- When delegating, include the agent file content as context in your prompt')
  lines.push('')
  lines.push('### Commands (`.claude/commands/`)')
  lines.push('Reusable slash commands as `.md` files. Users invoke as `/{command-name}`.')
  lines.push('- Each command contains a prompt template with placeholders')
  lines.push('- Check available commands before building one-off prompts')
  lines.push('')
  lines.push('### Skills (`.claude/skills/`)')
  lines.push('Directory-based capabilities with `SKILL.md` + supporting files.')
  lines.push('- More complex than commands — can include multi-file context')
  lines.push('- Check `.claude/skills/` before implementing from scratch')
  lines.push('')
  lines.push('### MCP Servers')
  lines.push('External tools available via Model Context Protocol.')
  lines.push('- Use `context7` to verify API docs before implementing')
  lines.push('- Check `.claude/settings.json` and `~/.claude.json` for configured servers')
  lines.push('- Never guess API signatures — verify with MCP first')
  lines.push('')
  lines.push('### Workflows')
  lines.push('Multi-step automated pipelines defined in the Workflow view.')
  lines.push('- Each step runs Claude CLI with a specific prompt')
  lines.push('- Steps chain sequentially; matched agents inject context per step')
  lines.push('- Output from each step feeds into the next')
  lines.push('')
  lines.push('### Knowledge DB')
  lines.push('SQLite-based project knowledge storage.')
  lines.push('- Query existing entries before solving recurring problems')
  lines.push('- Record new solutions and patterns for future sessions')
  lines.push('')
  lines.push('### Document Templates')
  lines.push('Standard templates in `docs/templates/`.')
  lines.push('- `prd-template.md` — PRD structure for feature planning')
  lines.push('- `spec-template.md` — Technical specification structure')
  lines.push('- Always follow template format when generating these documents')
  lines.push('')

  // ── Agent Orchestration ──
  lines.push('## Agent Orchestration')
  lines.push('')
  lines.push('Execution chain for multi-agent tasks:')
  lines.push('')
  lines.push('```')
  lines.push('plan (PRD) → design (spec) → decompose (tasks) → implement → review → document')
  lines.push('```')
  lines.push('')
  lines.push('Rules:')
  lines.push('- Read the agent `.md` file before invoking — never assume agent capabilities')
  lines.push('- Each agent output becomes input for the next stage')
  lines.push('- Never skip review after implementation')
  lines.push('- If an agent does not exist in `.claude/agents/`, do the work directly — do not fabricate agent names')
  lines.push('- Record architectural decisions and trade-offs in `docs/lessons-learned.md`')
  lines.push('')

  // ── Coding Rules ──
  lines.push('## Coding Rules')
  lines.push('')
  for (const rule of preset.codingRules) {
    lines.push(`- ${rule}`)
  }
  lines.push('')

  // ── Forbidden Patterns ──
  lines.push('## Forbidden Patterns')
  lines.push('')
  for (const pattern of preset.forbiddenPatterns) {
    lines.push(`- ${pattern}`)
  }
  lines.push('')

  // ── Quality Protocol ──
  lines.push('## Quality Protocol')
  lines.push('')
  lines.push('Priorities: Correctness > Speed. Verification > Assumption.')
  lines.push('')
  lines.push('- Verify API usage with context7 MCP before implementing')
  lines.push('- Do not guess. Verify then write.')
  lines.push('- After implementation, confirm spec compliance (not just "it compiles")')
  lines.push('- Record mistakes in docs/lessons-learned.md')
  lines.push('- If a pattern fails 3+ times, propose a rule addition to this file')
  lines.push('- Undocumented assumption = nonexistent. If it is not in code or docs, do not rely on it.')
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
