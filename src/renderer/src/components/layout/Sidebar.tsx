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
  ChevronRight,
  Clock,
  FolderOpen
} from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'

const navItems = [
  { id: 'dashboard' as const, icon: LayoutDashboard, shortcut: '1' },
  { id: 'workflow' as const, icon: GitBranch, shortcut: '2' },
  { id: 'agents' as const, icon: Bot, shortcut: '3' },
  { id: 'planning' as const, icon: FileText, shortcut: '4' },
  { id: 'claude-md' as const, icon: PenTool, shortcut: '5' },
  { id: 'commands' as const, icon: Terminal, shortcut: '6' },
  { id: 'skills' as const, icon: Zap, shortcut: '7' },
  { id: 'hooks' as const, icon: Wrench, shortcut: '8' },
  { id: 'mcp' as const, icon: Plug, shortcut: '9' },
  { id: 'knowledge' as const, icon: BookOpen, shortcut: '0' }
] as const

const bottomNavItems = [
  { id: 'timeline' as const, icon: Clock, shortcut: '' }
] as const

const navKeyMap: Record<string, string> = {
  'claude-md': 'claudemd'
}

export function Sidebar(): React.ReactElement {
  const { currentView, setView, sidebarCollapsed, toggleSidebar, project, clearProject } = useAppStore()
  const { t } = useTranslation()

  if (!project) return <div />

  return (
    <div
      className={clsx(
        'h-full bg-surface border-r border-border flex flex-col transition-all duration-200',
        sidebarCollapsed ? 'w-[52px]' : 'w-[200px]'
      )}
    >
      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(({ id, icon: Icon, shortcut }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors no-drag',
              currentView === id
                ? 'bg-surface-hover text-accent'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            )}
            title={shortcut ? `${t('nav.' + (navKeyMap[id] || id))} (⌘${shortcut})` : t('nav.' + (navKeyMap[id] || id))}
          >
            <Icon size={18} className="shrink-0" />
            {!sidebarCollapsed && (
              <>
                <span className="truncate">{t('nav.' + (navKeyMap[id] || id))}</span>
                {shortcut && <span className="ml-auto text-xs text-text-secondary opacity-50">⌘{shortcut}</span>}
              </>
            )}
          </button>
        ))}

        {/* Separator */}
        <div className="mx-3 my-2 border-t border-border" />

        {bottomNavItems.map(({ id, icon: Icon, shortcut }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors no-drag',
              currentView === id
                ? 'bg-surface-hover text-accent'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            )}
            title={shortcut ? `${t('nav.' + (navKeyMap[id] || id))} (⌘${shortcut})` : t('nav.' + (navKeyMap[id] || id))}
          >
            <Icon size={18} className="shrink-0" />
            {!sidebarCollapsed && (
              <span className="truncate">{t('nav.' + (navKeyMap[id] || id))}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Close Project */}
      <button
        onClick={clearProject}
        className={clsx(
          'no-drag flex items-center gap-3 px-3 py-2 text-sm transition-colors text-text-secondary hover:text-text-primary hover:bg-surface-hover',
          sidebarCollapsed && 'justify-center'
        )}
        title={t('common.closeProject')}
      >
        <FolderOpen size={18} className="shrink-0" />
        {!sidebarCollapsed && <span className="truncate">{t('common.closeProject')}</span>}
      </button>

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
