import { execSync } from 'child_process'
import { platform } from 'os'

export function isClaudeInstalled(): boolean {
  try {
    const cmd = platform() === 'win32' ? 'where claude' : 'which claude'
    execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' })
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
