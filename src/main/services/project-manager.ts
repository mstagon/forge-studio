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

  return {
    agentCount,
    commandCount,
    skillCount,
    hasMcpServers: false,
    branch,
    lastCommit
  }
}

export async function readProjectFile(projectPath: string, relativePath: string): Promise<string> {
  const fullPath = join(projectPath, relativePath)
  return readFile(fullPath, 'utf-8')
}

export async function listDirectory(dirPath: string): Promise<{ name: string; isDirectory: boolean }[]> {
  const entries = await readdir(dirPath, { withFileTypes: true })
  return entries
    .filter((e) => !e.name.startsWith('.') || e.name === '.claude')
    .map((e) => ({ name: e.name, isDirectory: e.isDirectory() }))
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}
