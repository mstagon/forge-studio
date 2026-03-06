import {
  LayoutDashboard,
  GitBranch,
  Bot,
  FileText,
  PenTool,
  Terminal,
  Plug,
  Wrench,
  BookOpen,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import { clsx } from 'clsx'

const navItems = [
  { id: 'dashboard' as const, icon: LayoutDashboard, label: 'Dashboard', shortcut: '1' },
  { id: 'workflow' as const, icon: GitBranch, label: 'Workflow', shortcut: '2' },
  { id: 'agents' as const, icon: Bot, label: 'Agents', shortcut: '3' },
  { id: 'planning' as const, icon: FileText, label: 'Planning', shortcut: '4' },
  { id: 'claude-md' as const, icon: PenTool, label: 'CLAUDE.md', shortcut: '5' },
  { id: 'commands' as const, icon: Terminal, label: 'Commands', shortcut: '6' },
  { id: 'skills' as const, icon: Zap, label: 'Skills', shortcut: '7' },
  { id: 'hooks' as const, icon: Wrench, label: 'Hooks', shortcut: '8' },
  { id: 'mcp' as const, icon: Plug, label: 'MCP', shortcut: '9' },
  { id: 'knowledge' as const, icon: BookOpen, label: 'Knowledge', shortcut: '0' }
] as const

export function Sidebar(): React.ReactElement {
  const { currentView, setView, sidebarCollapsed, toggleSidebar, project } = useAppStore()

  if (!project) return <div />

  return (
    <div
      className={clsx(
        'h-full bg-surface border-r border-border flex flex-col transition-all duration-200',
        sidebarCollapsed ? 'w-[52px]' : 'w-[200px]'
      )}
    >
      {/* Logo area */}
      <div className="h-[52px] flex items-center px-3 drag-region border-b border-border">
        {!sidebarCollapsed && (
          <span className="no-drag text-sm font-semibold text-text-primary truncate pl-8">
            Forge Studio
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(({ id, icon: Icon, label, shortcut }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors no-drag',
              currentView === id
                ? 'bg-surface-hover text-accent'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            )}
            title={`${label} (⌘${shortcut})`}
          >
            <Icon size={18} className="shrink-0" />
            {!sidebarCollapsed && (
              <>
                <span className="truncate">{label}</span>
                <span className="ml-auto text-xs text-text-secondary opacity-50">⌘{shortcut}</span>
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="no-drag p-3 border-t border-border text-text-secondary hover:text-text-primary transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </div>
  )
}
