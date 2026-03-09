import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  Sun,
  Moon,
  FolderOpen,
  Search,
  Clock,
  X
} from 'lucide-react'
import { useAppStore } from '../stores/app.store'
import { clsx } from 'clsx'

interface PaletteItem {
  id: string
  label: string
  category: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void
}

export function CommandPalette(): React.ReactElement | null {
  const { commandPaletteOpen, setCommandPaletteOpen, setView, project, theme, toggleTheme, toggleTerminal, toggleSidebar, clearProject } = useAppStore()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const items = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = []

    if (project) {
      list.push(
        { id: 'nav-dashboard', label: t('nav.dashboard'), category: t('commandPalette.categories.navigation'), icon: <LayoutDashboard size={16} />, shortcut: '1', action: () => setView('dashboard') },
        { id: 'nav-workflow', label: t('nav.workflow'), category: t('commandPalette.categories.navigation'), icon: <GitBranch size={16} />, shortcut: '2', action: () => setView('workflow') },
        { id: 'nav-agents', label: t('nav.agents'), category: t('commandPalette.categories.navigation'), icon: <Bot size={16} />, shortcut: '3', action: () => setView('agents') },
        { id: 'nav-planning', label: t('nav.planning'), category: t('commandPalette.categories.navigation'), icon: <FileText size={16} />, shortcut: '4', action: () => setView('planning') },
        { id: 'nav-claude-md', label: t('nav.claudemd'), category: t('commandPalette.categories.navigation'), icon: <PenTool size={16} />, shortcut: '5', action: () => setView('claude-md') },
        { id: 'nav-commands', label: t('nav.commands'), category: t('commandPalette.categories.navigation'), icon: <Terminal size={16} />, shortcut: '6', action: () => setView('commands') },
        { id: 'nav-skills', label: t('nav.skills'), category: t('commandPalette.categories.navigation'), icon: <Zap size={16} />, shortcut: '7', action: () => setView('skills') },
        { id: 'nav-hooks', label: t('nav.hooks'), category: t('commandPalette.categories.navigation'), icon: <Wrench size={16} />, shortcut: '8', action: () => setView('hooks') },
        { id: 'nav-mcp', label: t('nav.mcp'), category: t('commandPalette.categories.navigation'), icon: <Plug size={16} />, shortcut: '9', action: () => setView('mcp') },
        { id: 'nav-knowledge', label: t('nav.knowledge'), category: t('commandPalette.categories.navigation'), icon: <BookOpen size={16} />, shortcut: '0', action: () => setView('knowledge') },
        { id: 'nav-timeline', label: t('nav.timeline'), category: t('commandPalette.categories.navigation'), icon: <Clock size={16} />, action: () => setView('timeline') }
      )

      list.push(
        { id: 'toggle-terminal', label: t('commandPalette.items.toggleTerminal'), category: t('commandPalette.categories.ui'), icon: <Terminal size={16} />, shortcut: '`', action: toggleTerminal },
        { id: 'toggle-sidebar', label: t('commandPalette.items.toggleSidebar'), category: t('commandPalette.categories.ui'), icon: <LayoutDashboard size={16} />, shortcut: 'B', action: toggleSidebar }
      )

      list.push(
        { id: 'close-project', label: t('common.closeProject'), category: t('commandPalette.categories.project'), icon: <X size={16} />, action: clearProject }
      )
    }

    list.push(
      {
        id: 'toggle-theme',
        label: theme === 'dark' ? t('commandPalette.items.switchLight') : t('commandPalette.items.switchDark'),
        category: t('commandPalette.categories.appearance'),
        icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />,
        action: toggleTheme
      },
      {
        id: 'open-project',
        label: t('commandPalette.items.openProject'),
        category: t('commandPalette.categories.project'),
        icon: <FolderOpen size={16} />,
        action: async () => {
          const path = await window.forgeApi.app.openDirectory()
          if (path) {
            const { project: p, stats } = await window.forgeApi.project.open(path)
            useAppStore.getState().setProject(p, stats)
          }
        }
      }
    )

    return list
  }, [project, theme, setView, toggleTheme, toggleTerminal, toggleSidebar, clearProject, t])

  const filtered = useMemo(() => {
    if (!query) return items
    const q = query.toLowerCase()
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    )
  }, [items, query])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandPaletteOpen])

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const execute = (item: PaletteItem): void => {
    setCommandPaletteOpen(false)
    item.action()
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) execute(filtered[selectedIndex])
    } else if (e.key === 'Escape') {
      setCommandPaletteOpen(false)
    }
  }

  if (!commandPaletteOpen) return null

  // Group by category
  const groups = new Map<string, PaletteItem[]>()
  for (const item of filtered) {
    const list = groups.get(item.category) || []
    list.push(item)
    groups.set(item.category, list)
  }

  let flatIndex = 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div className="fixed inset-0 bg-black/50" />
      <div
        className="relative w-[520px] bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={16} className="text-text-secondary shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('commandPalette.placeholder')}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-secondary focus:outline-none"
          />
          <kbd className="text-[10px] text-text-secondary bg-bg px-1.5 py-0.5 rounded border border-border">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-secondary">
              {t('commandPalette.noResults')}
            </div>
          ) : (
            Array.from(groups.entries()).map(([category, groupItems]) => (
              <div key={category}>
                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                  {category}
                </div>
                {groupItems.map((item) => {
                  const idx = flatIndex++
                  return (
                    <button
                      key={item.id}
                      onClick={() => execute(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                        idx === selectedIndex
                          ? 'bg-accent/10 text-accent'
                          : 'text-text-primary hover:bg-surface-hover'
                      )}
                    >
                      <span className="shrink-0 text-text-secondary">{item.icon}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="text-[10px] text-text-secondary bg-bg px-1.5 py-0.5 rounded border border-border">
                          {'\u2318'}{item.shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
