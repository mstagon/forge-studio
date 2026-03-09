import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import type { TechStackPreset, PresetAgent, PresetCommand, PresetSkill, PresetHook } from '../../shared/types/preset.types'

export async function exportProjectAsPreset(
  projectPath: string,
  meta: { name: string; description: string; icon: string; category: TechStackPreset['category'] }
): Promise<TechStackPreset> {
  const agents = await readAgents(projectPath)
  const commands = await readCommands(projectPath)
  const skills = await readSkills(projectPath)
  const hooks = await readHooks(projectPath)
  const claudeMdInfo = await parseClaudeMdForPreset(projectPath)

  const preset: TechStackPreset = {
    id: `user-${Date.now()}`,
    name: meta.name,
    description: meta.description,
    icon: meta.icon,
    category: meta.category,
    stack: claudeMdInfo.stack,
    architecture: claudeMdInfo.architecture,
    build: claudeMdInfo.build,
    codingRules: claudeMdInfo.codingRules,
    forbiddenPatterns: claudeMdInfo.forbiddenPatterns,
    agents,
    commands,
    skills,
    hooks,
    recommendedMcp: []
  }

  return preset
}

async function readAgents(projectPath: string): Promise<PresetAgent[]> {
  const dir = join(projectPath, '.claude', 'agents')
  try {
    const files = await readdir(dir)
    const agents: PresetAgent[] = []
    for (const file of files) {
      if (!file.endsWith('.md')) continue
      const content = await readFile(join(dir, file), 'utf-8')
      agents.push({ fileName: file.replace('.md', ''), content })
    }
    return agents
  } catch {
    return []
  }
}

async function readCommands(projectPath: string): Promise<PresetCommand[]> {
  const dir = join(projectPath, '.claude', 'commands')
  try {
    const files = await readdir(dir)
    const commands: PresetCommand[] = []
    for (const file of files) {
      if (!file.endsWith('.md')) continue
      const content = await readFile(join(dir, file), 'utf-8')
      commands.push({ fileName: file.replace('.md', ''), content })
    }
    return commands
  } catch {
    return []
  }
}

async function readSkills(projectPath: string): Promise<PresetSkill[]> {
  const dir = join(projectPath, '.claude', 'skills')
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    const skills: PresetSkill[] = []
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      try {
        const content = await readFile(join(dir, entry.name, 'SKILL.md'), 'utf-8')
        skills.push({ dirName: entry.name, content })
      } catch {
        // no SKILL.md
      }
    }
    return skills
  } catch {
    return []
  }
}

async function readHooks(projectPath: string): Promise<TechStackPreset['hooks']> {
  try {
    const raw = await readFile(join(projectPath, '.claude', 'settings.json'), 'utf-8')
    const settings = JSON.parse(raw)
    const hooks: TechStackPreset['hooks'] = {}

    if (settings.hooks?.PreToolUse) {
      hooks.PreToolUse = settings.hooks.PreToolUse.map((h: { matcher?: string; hooks?: { command: string }[] }) => ({
        matcher: h.matcher,
        command: h.hooks?.[0]?.command || ''
      })).filter((h: PresetHook) => h.command)
    }

    if (settings.hooks?.PostToolUse) {
      hooks.PostToolUse = settings.hooks.PostToolUse.map((h: { matcher?: string; hooks?: { command: string }[] }) => ({
        matcher: h.matcher,
        command: h.hooks?.[0]?.command || ''
      })).filter((h: PresetHook) => h.command)
    }

    if (settings.hooks?.SessionStart) {
      hooks.SessionStart = settings.hooks.SessionStart.map((h: { hooks?: { command: string }[] }) => ({
        command: h.hooks?.[0]?.command || ''
      })).filter((h: PresetHook) => h.command)
    }

    return hooks
  } catch {
    return {}
  }
}

async function parseClaudeMdForPreset(projectPath: string): Promise<{
  stack: TechStackPreset['stack']
  architecture: TechStackPreset['architecture']
  build: TechStackPreset['build']
  codingRules: string[]
  forbiddenPatterns: string[]
}> {
  const defaults = {
    stack: { language: '', framework: '' } as TechStackPreset['stack'],
    architecture: { pattern: '', structure: '' },
    build: { setup: '' },
    codingRules: [] as string[],
    forbiddenPatterns: [] as string[]
  }

  try {
    const content = await readFile(join(projectPath, 'CLAUDE.md'), 'utf-8')
    const sections = content.split(/^## /gm)

    for (const section of sections) {
      const lines = section.trim().split('\n')
      const title = lines[0]?.toLowerCase() || ''

      if (title.includes('tech stack') || title.includes('기술 스택')) {
        const stackLines = lines.slice(1).filter((l) => l.startsWith('- '))
        for (const line of stackLines) {
          const [key, ...valParts] = line.replace(/^- /, '').split(':')
          const val = valParts.join(':').trim()
          const k = key.trim().toLowerCase()
          if (k.includes('language') || k.includes('언어')) defaults.stack.language = val
          if (k.includes('framework') || k.includes('프레임워크')) defaults.stack.framework = val
          if (k.includes('state')) defaults.stack.stateManagement = val
          if (k.includes('backend') || k.includes('백엔드')) defaults.stack.backend = val
          if (k.includes('database') || k.includes('db')) defaults.stack.database = val
          if (k.includes('styling') || k.includes('css')) defaults.stack.styling = val
          if (k.includes('router')) defaults.stack.router = val
        }
      }

      if (title.includes('architecture') || title.includes('아키텍처')) {
        const archLines = lines.slice(1).filter((l) => l.startsWith('- '))
        for (const line of archLines) {
          const [key, ...valParts] = line.replace(/^- /, '').split(':')
          const val = valParts.join(':').trim()
          const k = key.trim().toLowerCase()
          if (k.includes('pattern') || k.includes('패턴')) defaults.architecture.pattern = val
          if (k.includes('structure') || k.includes('구조')) defaults.architecture.structure = val
        }
      }

      if (title.includes('build') || title.includes('빌드')) {
        const codeBlock = section.match(/```[\s\S]*?\n([\s\S]*?)```/)
        if (codeBlock) defaults.build.setup = codeBlock[1].trim()
      }

      if (title.includes('coding rule') || title.includes('코딩 규칙')) {
        defaults.codingRules = lines.slice(1)
          .filter((l) => l.startsWith('- '))
          .map((l) => l.replace(/^- /, '').trim())
      }

      if (title.includes('forbidden') || title.includes('금지')) {
        defaults.forbiddenPatterns = lines.slice(1)
          .filter((l) => l.startsWith('- '))
          .map((l) => l.replace(/^- /, '').trim())
      }
    }
  } catch {
    // no CLAUDE.md
  }

  return defaults
}
