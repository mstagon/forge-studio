import { useEffect, useCallback, useRef } from 'react'
import { useAppStore } from './stores/app.store'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { TerminalPanel } from './components/terminal/TerminalPanel'
import { WelcomeView } from './routes/WelcomeView'
import { DashboardView } from './routes/DashboardView'
import { AgentsView } from './routes/AgentsView'
import { CommandsView } from './routes/CommandsView'
import { SkillsView } from './routes/SkillsView'
import { ClaudeMdView } from './routes/ClaudeMdView'
import { HooksView } from './routes/HooksView'
import { McpView } from './routes/McpView'
import { WorkflowView } from './routes/WorkflowView'
import { PlanningView } from './routes/PlanningView'
import { KnowledgeView } from './routes/KnowledgeView'

function MainContent(): React.ReactElement {
  const currentView = useAppStore((s) => s.currentView)

  switch (currentView) {
    case 'welcome':
      return <WelcomeView />
    case 'dashboard':
      return <DashboardView />
    case 'agents':
      return <AgentsView />
    case 'commands':
      return <CommandsView />
    case 'skills':
      return <SkillsView />
    case 'claude-md':
      return <ClaudeMdView />
    case 'hooks':
      return <HooksView />
    case 'mcp':
      return <McpView />
    case 'workflow':
      return <WorkflowView />
    case 'planning':
      return <PlanningView />
    case 'knowledge':
      return <KnowledgeView />
    default:
      return <WelcomeView />
  }
}

export default function App(): React.ReactElement {
  const { project, terminalVisible, terminalHeight, setTerminalHeight, setClaudeInfo, setView } = useAppStore()
  const resizingRef = useRef(false)
  const startYRef = useRef(0)
  const startHeightRef = useRef(0)

  // Check Claude CLI on mount
  useEffect(() => {
    ;(async () => {
      const installed = await window.forgeApi.claude.checkInstalled()
      const version = installed ? await window.forgeApi.claude.getVersion() : null
      setClaudeInfo(installed, version)
    })()
  }, [setClaudeInfo])

  // Start file watcher when project opens
  useEffect(() => {
    if (project) {
      window.forgeApi.project.startWatching(project.path)
    }
  }, [project?.path])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (!e.metaKey && !e.ctrlKey) return
      if (!project) return

      const viewMap: Record<string, Parameters<typeof setView>[0]> = {
        '1': 'dashboard',
        '2': 'workflow',
        '3': 'agents',
        '4': 'planning',
        '5': 'claude-md',
        '6': 'commands',
        '7': 'skills',
        '8': 'hooks',
        '9': 'mcp',
        '0': 'knowledge'
      }

      if (viewMap[e.key]) {
        e.preventDefault()
        setView(viewMap[e.key])
      }

      if (e.key === '`') {
        e.preventDefault()
        useAppStore.getState().toggleTerminal()
      }

      if (e.key === 'b') {
        e.preventDefault()
        useAppStore.getState().toggleSidebar()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [project, setView])

  // Terminal resize drag
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    resizingRef.current = true
    startYRef.current = e.clientY
    startHeightRef.current = useAppStore.getState().terminalHeight
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    const handleMove = (ev: MouseEvent): void => {
      if (!resizingRef.current) return
      const delta = startYRef.current - ev.clientY
      setTerminalHeight(startHeightRef.current + delta)
    }

    const handleUp = (): void => {
      resizingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }, [setTerminalHeight])

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <div className="h-[3px] drag-region bg-bg shrink-0" />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <MainContent />
          </div>

          {project && terminalVisible && (
            <div
              onMouseDown={handleResizeStart}
              className="h-[3px] bg-border hover:bg-accent cursor-row-resize transition-colors shrink-0"
            />
          )}

          {project && terminalVisible && (
            <div style={{ height: terminalHeight }} className="shrink-0">
              <TerminalPanel />
            </div>
          )}
        </div>
      </div>

      <StatusBar />
    </div>
  )
}
