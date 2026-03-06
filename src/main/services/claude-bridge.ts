import { execSync } from 'child_process'

export function isClaudeInstalled(): boolean {
  try {
    execSync('which claude', { encoding: 'utf-8', stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

export function getClaudeVersion(): string | null {
  try {
    const output = execSync('claude --version', { encoding: 'utf-8', stdio: 'pipe' })
    return output.trim()
  } catch {
    return null
  }
}
