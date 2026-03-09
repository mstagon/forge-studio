import type { IPty } from 'node-pty'
import { platform } from 'os'
import { access, readdir } from 'fs/promises'
import { join } from 'path'
import { BrowserWindow } from 'electron'
import { IPC } from '../../shared/constants/channels'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pty = require('node-pty')

export interface TeamMember {
  role: string
  agent: string
  prompt: string
  outputFile: string // expected output file path (relative to project)
}

export interface TeamRunState {
  id: string
  featureName: string
  members: TeamMemberStatus[]
  currentMember: number
  status: 'idle' | 'running' | 'done' | 'failed'
}

export interface TeamMemberStatus extends TeamMember {
  status: 'pending' | 'running' | 'done' | 'failed' | 'skipped'
  output: string
}

let currentTeamRun: TeamRunState | null = null
let currentPty: IPty | null = null
let mainWindow: BrowserWindow | null = null

export function initAgentTeam(win: BrowserWindow): void {
  mainWindow = win
}

function emit(state: TeamRunState): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC.TEAM_STATE, state)
  }
}

export function getTeamState(): TeamRunState | null {
  return currentTeamRun
}

export type TeamMode = 'project' | 'feature'

function buildProjectTeam(projectName: string): TeamMember[] {
  return [
    {
      role: 'Product Strategist',
      agent: 'product-strategist',
      prompt: `You are a product strategist. Define the overall project vision, scope, and goals for: "${projectName}". Include: project overview, target audience, core value proposition, key assumptions, constraints, and success criteria. Save the output to docs/planning/project-overview.md`,
      outputFile: 'docs/planning/project-overview.md'
    },
    {
      role: 'System Architect',
      agent: 'system-architect',
      prompt: `You are a system architect. Read the project overview from docs/planning/project-overview.md and design the overall system architecture. Include: tech stack decisions with rationale, high-level architecture diagram (in mermaid), directory/module structure, data model overview, external service integrations, and key architectural decisions (ADRs). Save the output to docs/planning/architecture.md`,
      outputFile: 'docs/planning/architecture.md'
    },
    {
      role: 'Feature Planner',
      agent: 'feature-planner',
      prompt: `You are a feature planner. Read the project overview from docs/planning/project-overview.md and the architecture from docs/planning/architecture.md. Identify all features needed, group them into milestones, define priorities (must-have / should-have / nice-to-have), map dependencies between features, and suggest an implementation order. Output as a structured roadmap. Save the output to docs/planning/feature-roadmap.md`,
      outputFile: 'docs/planning/feature-roadmap.md'
    }
  ]
}

function buildFeatureTeam(featureName: string): TeamMember[] {
  return [
    {
      role: 'Product Manager',
      agent: 'product-planner',
      prompt: `You are a product manager. Write a comprehensive PRD (Product Requirements Document) for the feature: "${featureName}". If docs/planning/project-overview.md exists, use it as context for project-level alignment. If docs/templates/prd-template.md exists, follow that template structure. Include: background, target users, user stories, functional requirements, edge cases, non-functional requirements, and success metrics. Save the output to docs/prd/${featureName}.md`,
      outputFile: `docs/prd/${featureName}.md`
    },
    {
      role: 'Tech Architect',
      agent: 'tech-architect',
      prompt: `You are a tech architect. Read the PRD from docs/prd/${featureName}.md and create a detailed technical specification. If docs/planning/architecture.md exists, align with the project architecture. If docs/templates/spec-template.md exists, follow that template structure. Include: architecture overview, component design, data models, API contracts, state management approach, error handling strategy, and test plan. Use context7 MCP to verify any package APIs. Save the output to docs/specs/${featureName}-spec.md`,
      outputFile: `docs/specs/${featureName}-spec.md`
    },
    {
      role: 'Task Decomposer',
      agent: 'task-decomposer',
      prompt: `You are a task decomposition specialist. Read the technical spec from docs/specs/${featureName}-spec.md and break it into ordered, executable tasks. Each task should be completable in ~30 minutes. Identify dependencies and which tasks can be parallelized. Save the output to docs/specs/${featureName}-tasks.md`,
      outputFile: `docs/specs/${featureName}-tasks.md`
    }
  ]
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function scanExistingDocs(projectPath: string): Promise<string[]> {
  const docDirs = ['planning', 'prd', 'specs', 'planningdocs', 'architecture', 'templates']
  const found: string[] = []
  for (const dir of docDirs) {
    try {
      const entries = await readdir(join(projectPath, 'docs', dir))
      for (const entry of entries) {
        if (/\.(md|txt|rst|json|yaml|yml|csv|xml|html|toml|adoc|tex)$/i.test(entry)) {
          found.push(`docs/${dir}/${entry}`)
        }
      }
    } catch { /* dir doesn't exist */ }
  }
  return found
}

function injectExistingDocsContext(prompt: string, existingDocs: string[]): string {
  if (existingDocs.length === 0) return prompt
  const docList = existingDocs.map((d) => `  - ${d}`).join('\n')
  return `${prompt}\n\nIMPORTANT: The following existing documents are available in the project. Read and reference them as context before generating your output:\n${docList}`
}

export async function startTeam(projectPath: string, name: string, mode: TeamMode = 'feature'): Promise<TeamRunState> {
  if (currentTeamRun?.status === 'running') {
    throw new Error('A team is already running')
  }

  const existingDocs = await scanExistingDocs(projectPath)
  const rawMembers = mode === 'project' ? buildProjectTeam(name) : buildFeatureTeam(name)
  const members = rawMembers.map((m) => ({
    ...m,
    prompt: injectExistingDocsContext(m.prompt, existingDocs.filter((d) => d !== m.outputFile))
  }))

  // Check which steps already have output files (resume support)
  let firstPending = 0
  const memberStatuses: TeamMemberStatus[] = []
  for (const m of members) {
    const exists = await fileExists(join(projectPath, m.outputFile))
    memberStatuses.push({
      ...m,
      status: exists ? 'skipped' : 'pending',
      output: exists ? `[Forge Studio] Output already exists: ${m.outputFile} — skipped.` : ''
    })
    if (exists && firstPending === memberStatuses.length - 1) {
      firstPending = memberStatuses.length
    }
  }

  currentTeamRun = {
    id: `team-${Date.now()}`,
    featureName: name,
    members: memberStatuses,
    currentMember: firstPending,
    status: firstPending >= members.length ? 'done' : 'running'
  }

  emit(currentTeamRun)

  if (currentTeamRun.status !== 'done') {
    runNextMember(projectPath)
  }

  return currentTeamRun
}

function runNextMember(projectPath: string): void {
  if (!currentTeamRun) return

  if (currentTeamRun.currentMember >= currentTeamRun.members.length) {
    currentTeamRun.status = 'done'
    emit(currentTeamRun)
    return
  }

  const member = currentTeamRun.members[currentTeamRun.currentMember]

  // Skip already completed steps
  if (member.status === 'skipped') {
    currentTeamRun.currentMember++
    emit(currentTeamRun)
    runNextMember(projectPath)
    return
  }

  member.status = 'running'
  emit(currentTeamRun)

  const shell = platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/zsh'
  const claudeCmd = `claude --dangerously-skip-permissions -p "${member.prompt.replace(/"/g, '\\"')}"; exit $?\n`

  // Remove CLAUDECODE to allow nested claude CLI invocations
  const { CLAUDECODE: _, ...cleanEnv } = process.env

  const ptyProcess: IPty = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 120,
    rows: 30,
    cwd: projectPath,
    env: {
      ...cleanEnv,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor'
    }
  })
  currentPty = ptyProcess

  let output = ''
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null
  let lastDataAt = Date.now()

  const TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes no-output timeout

  ptyProcess.onData((data: string) => {
    output += data
    lastDataAt = Date.now()
    member.output = output.slice(-8000)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC.TEAM_OUTPUT, currentTeamRun!.id, member.role, data)
    }
  })

  ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
    if (timeoutTimer) clearInterval(timeoutTimer)
    currentPty = null
    if (!currentTeamRun) return

    member.status = exitCode === 0 ? 'done' : 'failed'

    if (exitCode !== 0) {
      currentTeamRun.status = 'failed'
      emit(currentTeamRun)
      return
    }

    currentTeamRun.currentMember++
    emit(currentTeamRun)
    runNextMember(projectPath)
  })

  // Check for timeout every 30s — kill if no output for TIMEOUT_MS
  timeoutTimer = setInterval(() => {
    if (Date.now() - lastDataAt > TIMEOUT_MS && currentPty) {
      member.output += '\n\n[Forge Studio] Timeout: no output for 5 minutes. Process killed.'
      currentPty.kill()
      currentPty = null
    }
  }, 30_000)

  setTimeout(() => {
    if (currentPty) {
      currentPty.write(claudeCmd)
    }
  }, 500)
}

export function stopTeam(): void {
  if (currentPty) {
    currentPty.kill()
    currentPty = null
  }
  if (currentTeamRun) {
    const member = currentTeamRun.members[currentTeamRun.currentMember]
    if (member && member.status === 'running') {
      member.status = 'failed'
    }
    currentTeamRun.status = 'failed'
    emit(currentTeamRun)
  }
}
