import { readdir, readFile, stat, access } from 'fs/promises'
import { join, basename } from 'path'
import type { ForgeProject, ProjectStats } from '../../shared/types/project.types'
import { execSync } from 'child_process'

export async function openProject(projectPath: string): Promise<ForgeProject> {
  const hasClaudeMd = await fileExists(join(projectPath, 'CLAUDE.md'))
  const hasClaudeDir = await fileExists(join(projectPath, '.claude'))

  return {
    id: Buffer.from(projectPath).toString('base64url'),
    name: basename(projectPath),
    path: projectPath,
    hasClaudeMd,
    hasClaudeDir,
    lastOpenedAt: new Date().toISOString()
  }
}

export async function getProjectStats(projectPath: string): Promise<ProjectStats> {
  const claudeDir = join(projectPath, '.claude')
  let agentCount = 0
  let commandCount = 0
  let skillCount = 0

  try {
    const agents = await readdir(join(claudeDir, 'agents'))
    agentCount = agents.filter((f) => f.endsWith('.md')).length
  } catch {
    /* no agents dir */
  }

  try {
    const commands = await readdir(join(claudeDir, 'commands'))
    commandCount = commands.filter((f) => f.endsWith('.md')).length
  } catch {
    /* no commands dir */
  }

  try {
    const skills = await readdir(join(claudeDir, 'skills'))
    skillCount = skills.length
  } catch {
    /* no skills dir */
  }

  let branch: string | undefined
  let lastCommit: string | undefined
  try {
    branch = execSync('git branch --show-current', { cwd: projectPath, encoding: 'utf-8', stdio: 'pipe' }).trim()
    lastCommit = execSync('git log --oneline -1', { cwd: projectPath, encoding: 'utf-8', stdio: 'pipe' }).trim()
  } catch {
    /* not a git repo */
  }

  let mcpServerCount = 0
  try {
    const home = process.env.HOME || ''
    const raw = await readFile(join(home, '.claude.json'), 'utf-8')
    const config = JSON.parse(raw)
    mcpServerCount = Object.keys(config.mcpServers || {}).length
  } catch {
    /* no .claude.json */
  }

  return {
    agentCount,
    commandCount,
    skillCount,
    mcpServerCount,
    branch,
    lastCommit
  }
}

export async function readProjectFile(projectPath: string, relativePath: string): Promise<string> {
  const fullPath = join(projectPath, relativePath)
  return readFile(fullPath, 'utf-8')
}

export async function listDirectory(dirPath: string): Promise<{ name: string; isDirectory: boolean }[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    return entries
      .filter((e) => !e.name.startsWith('.') || e.name === '.claude')
      .map((e) => ({ name: e.name, isDirectory: e.isDirectory() }))
  } catch {
    return []
  }
}

export interface GitLogEntry {
  hash: string
  shortHash: string
  author: string
  date: string
  relativeDate: string
  message: string
  filesChanged?: number
}

export async function getGitLog(projectPath: string, count = 50): Promise<GitLogEntry[]> {
  try {
    const SEP = '|||'
    const raw = execSync(
      `git log --format="%H${SEP}%h${SEP}%an${SEP}%aI${SEP}%ar${SEP}%s" -${count}`,
      { cwd: projectPath, encoding: 'utf-8', stdio: 'pipe', maxBuffer: 1024 * 1024 }
    ).trim()
    if (!raw) return []

    return raw.split('\n').map((line) => {
      const [hash, shortHash, author, date, relativeDate, ...rest] = line.split(SEP)
      return { hash, shortHash, author, date, relativeDate, message: rest.join(SEP) }
    })
  } catch {
    return []
  }
}

export function getGitDiffStat(projectPath: string): string {
  try {
    return execSync('git diff --stat HEAD~1 HEAD 2>/dev/null || echo ""', {
      cwd: projectPath, encoding: 'utf-8', stdio: 'pipe'
    }).trim()
  } catch {
    return ''
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}
