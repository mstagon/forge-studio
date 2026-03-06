import { useEffect, useCallback, useRef } from 'react'
import { useAppStore } from './stores/app.store'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { TerminalPanel } from './components/terminal/TerminalPanel'
import { WelcomeView } from './routes/WelcomeView'
import { DashboardView } from './routes/DashboardView'
import { PlaceholderView } from './routes/PlaceholderView'

function MainContent(): React.ReactElement {
  const currentView = useAppStore((s) => s.currentView)

  switch (currentView) {
    case 'welcome':
      return <WelcomeView />
    case 'dashboard':
      return <DashboardView />
    case 'workflow':
      return <PlaceholderView title="Workflow Engine" />
    case 'agents':
      return <PlaceholderView title="Agent Studio" />
    case 'planning':
      return <PlaceholderView title="Planning Hub" />
    case 'claude-md':
      return <PlaceholderView title="CLAUDE.md Editor" />
    case 'commands':
      return <PlaceholderView title="Command Builder" />
    case 'skills':
      return <PlaceholderView title="Skill Builder" />
    case 'hooks':
      return <PlaceholderView title="Hook Configuration" />
    case 'mcp':
      return <PlaceholderView title="MCP Studio" />
    case 'knowledge':
      return <PlaceholderView title="Knowledge Dashboard" />
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
      {/* Title bar drag region */}
      <div className="h-[3px] drag-region bg-bg shrink-0" />

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Content + Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <MainContent />
          </div>

          {/* Terminal resize handle */}
          {project && terminalVisible && (
            <div
              onMouseDown={handleResizeStart}
              className="h-[3px] bg-border hover:bg-accent cursor-row-resize transition-colors shrink-0"
            />
          )}

          {/* Terminal */}
          {project && terminalVisible && (
            <div style={{ height: terminalHeight }} className="shrink-0">
              <TerminalPanel />
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  )
}
