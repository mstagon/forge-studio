import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../stores/app.store'
import { Play, Rocket, Bot, Terminal } from 'lucide-react'
import type { CommandConfig } from '../../../../shared/types/agent.types'

interface ScriptButton {
  name: string
  command: string
}

const COMMON_SCRIPT_NAMES = ['dev', 'build', 'test', 'lint', 'start']

export function RunBar(): React.ReactElement {
  const { t } = useTranslation()
  const project = useAppStore((s) => s.project)
  const claudeInstalled = useAppStore((s) => s.claudeInstalled)
  const terminalPtyId = useAppStore((s) => s.terminalPtyId)

  const [scripts, setScripts] = useState<ScriptButton[]>([])
  const [commands, setCommands] = useState<CommandConfig[]>([])

  // Load package.json scripts
  useEffect(() => {
    if (!project) {
      setScripts([])
      return
    }

    let cancelled = false
    const loadScripts = async (): Promise<void> => {
      try {
        const pkgPath = project.path + '/package.json'
        const content = await window.forgeApi.fs.readFile(pkgPath)
        const pkg = JSON.parse(content) as { scripts?: Record<string, string> }
        if (cancelled) return

        if (pkg.scripts) {
          const found: ScriptButton[] = []
          for (const name of COMMON_SCRIPT_NAMES) {
            if (pkg.scripts[name]) {
              found.push({ name, command: `npm run ${name}` })
            }
          }
          setScripts(found)
        } else {
          setScripts([])
        }
      } catch {
        if (!cancelled) setScripts([])
      }
    }

    loadScripts()
    return () => { cancelled = true }
  }, [project?.path])

  // Load Claude commands
  useEffect(() => {
    if (!project) {
      setCommands([])
      return
    }

    let cancelled = false
    const loadCommands = async (): Promise<void> => {
      try {
        const list = await window.forgeApi.commands.list(project.path)
        if (!cancelled) setCommands(list)
      } catch {
        if (!cancelled) setCommands([])
      }
    }

    loadCommands()
    return () => { cancelled = true }
  }, [project?.path])

  const executeCommand = useCallback((command: string) => {
    if (!terminalPtyId) return
    window.forgeApi.terminal.write(terminalPtyId, command + '\n')
  }, [terminalPtyId])

  const hasScripts = scripts.length > 0
  const hasCommands = commands.length > 0
  const showClaude = claudeInstalled
  const hasContent = hasScripts || hasCommands || showClaude

  if (!hasContent) return <div />

  return (
    <div className="bg-surface border-b border-border px-3 py-1.5 flex items-center gap-2 overflow-x-auto shrink-0">
      {/* Scripts section */}
      {hasScripts && (
        <>
          <span className="text-xs text-text-secondary flex items-center gap-1 shrink-0">
            <Rocket size={12} />
            {t('runBar.scripts')}
          </span>
          {scripts.map((script) => (
            <button
              key={script.name}
              onClick={() => executeCommand(script.command)}
              disabled={!terminalPtyId}
              className="bg-surface border border-border rounded-full px-3 py-1 text-xs hover:border-accent transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play size={10} />
              {script.name}
            </button>
          ))}
        </>
      )}

      {/* Separator */}
      {hasScripts && (hasCommands || showClaude) && (
        <div className="h-4 w-px bg-border shrink-0" />
      )}

      {/* Claude section */}
      {showClaude && (
        <>
          <span className="text-xs text-text-secondary flex items-center gap-1 shrink-0">
            <Bot size={12} />
            {t('runBar.commands')}
          </span>
          <button
            onClick={() => executeCommand('claude --dangerously-skip-permissions')}
            disabled={!terminalPtyId}
            className="bg-surface border border-border rounded-full px-3 py-1 text-xs hover:border-accent transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Terminal size={10} />
            {t('runBar.startClaude')}
          </button>
          {hasCommands && commands.map((cmd) => (
            <button
              key={cmd.fileName}
              onClick={() => executeCommand(`claude --dangerously-skip-permissions /project:${cmd.fileName.replace('.md', '')}`)}
              disabled={!terminalPtyId}
              className="bg-surface border border-border rounded-full px-3 py-1 text-xs hover:border-accent transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play size={10} />
              /{cmd.fileName.replace('.md', '')}
            </button>
          ))}
        </>
      )}
    </div>
  )
}
