import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  GitCommit,
  Clock,
  CheckCircle2,
  Circle,
  FileText,
  Bot,
  Zap,
  Wrench,
  Plug,
  BookOpen,
  PenTool,
  GitBranch,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { useAppStore } from '../stores/app.store'
import { clsx } from 'clsx'

interface GitLogEntry {
  hash: string
  shortHash: string
  author: string
  date: string
  relativeDate: string
  message: string
}

interface SetupItem {
  id: string
  icon: React.ElementType
  label: string
  done: boolean
  view?: string
  count?: number
}

// ── Setup Checklist ──

function SetupChecklist({ items, onNavigate }: {
  items: SetupItem[]
  onNavigate: (view: string) => void
}): React.ReactElement {
  const { t } = useTranslation()
  const doneCount = items.filter((i) => i.done).length
  const total = items.length
  const pct = Math.round((doneCount / total) * 100)

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">{t('timeline.projectSetup')}</h3>
        <span className="text-xs text-text-secondary">{doneCount}/{total}</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-bg rounded-full mb-5 overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            pct === 100 ? 'bg-success' : 'bg-accent'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => item.view && onNavigate(item.view)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group',
              item.view ? 'hover:bg-surface-hover cursor-pointer' : 'cursor-default'
            )}
          >
            {item.done ? (
              <CheckCircle2 size={16} className="text-success shrink-0" />
            ) : (
              <Circle size={16} className="text-text-secondary shrink-0" />
            )}
            <item.icon size={14} className="text-text-secondary shrink-0" />
            <span className={clsx(
              'text-left flex-1',
              item.done ? 'text-text-secondary' : 'text-text-primary'
            )}>
              {item.label}
            </span>
            {item.count !== undefined && item.count > 0 && (
              <span className="text-xs text-text-secondary bg-bg px-1.5 py-0.5 rounded">{item.count}</span>
            )}
            {item.view && (
              <ArrowRight size={12} className="text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Commit Timeline ──

function CommitTimeline({ commits, loading }: {
  commits: GitLogEntry[]
  loading: boolean
}): React.ReactElement {
  const { t } = useTranslation()

  // Group commits by date
  const grouped = useMemo(() => {
    const groups: { date: string; label: string; commits: GitLogEntry[] }[] = []
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    for (const commit of commits) {
      const dateStr = commit.date.slice(0, 10)
      let label = dateStr
      if (dateStr === today) label = t('timeline.today')
      else if (dateStr === yesterday) label = t('timeline.yesterday')

      const existing = groups.find((g) => g.date === dateStr)
      if (existing) {
        existing.commits.push(commit)
      } else {
        groups.push({ date: dateStr, label, commits: [commit] })
      }
    }
    return groups
  }, [commits, t])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-text-secondary text-sm">
        <RefreshCw size={16} className="animate-spin mr-2" />
        {t('common.loading')}
      </div>
    )
  }

  if (commits.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary text-sm">
        <GitCommit size={32} className="mx-auto mb-3 opacity-40" />
        <p>{t('timeline.noCommits')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.date}>
          {/* Date header */}
          <div className="flex items-center gap-2 mb-3 sticky top-0 bg-bg/80 backdrop-blur-sm py-1 z-10">
            <Clock size={12} className="text-text-secondary" />
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              {group.label}
            </span>
            <span className="text-xs text-text-secondary">({group.commits.length})</span>
          </div>

          {/* Commits */}
          <div className="relative ml-2">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

            <div className="space-y-0.5">
              {group.commits.map((commit, idx) => (
                <div key={commit.hash} className="flex items-start gap-3 pl-0 group">
                  {/* Dot */}
                  <div className={clsx(
                    'w-[15px] h-[15px] rounded-full border-2 shrink-0 mt-1.5 z-10',
                    idx === 0 && group.date === grouped[0]?.date
                      ? 'border-accent bg-accent/20'
                      : 'border-border bg-surface'
                  )} />

                  {/* Content */}
                  <div className="flex-1 py-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-primary truncate flex-1">
                        {commit.message}
                      </span>
                      <span className="text-[10px] font-mono text-text-secondary shrink-0 bg-surface px-1.5 py-0.5 rounded border border-border">
                        {commit.shortHash}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-text-secondary">{commit.author}</span>
                      <span className="text-[11px] text-text-secondary">{commit.relativeDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main TimelineView ──

export function TimelineView(): React.ReactElement {
  const { t } = useTranslation()
  const { project, projectStats, setView, refreshStats } = useAppStore()
  const [commits, setCommits] = useState<GitLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [hasHooks, setHasHooks] = useState(false)
  const [knowledgeCount, setKnowledgeCount] = useState(0)

  // Load git log + hooks + knowledge
  useEffect(() => {
    if (!project) return
    let cancelled = false

    const load = async (): Promise<void> => {
      setLoading(true)
      try {
        const [log, settings, kEntries] = await Promise.all([
          window.forgeApi.git.log(project.path, 50),
          window.forgeApi.settings.read(project.path).catch(() => null),
          window.forgeApi.knowledge.search({ projectPath: project.path, limit: 1 }).catch(() => ({ total: 0 }))
        ])
        if (cancelled) return
        setCommits(log)
        const s = settings as { hooks?: Record<string, unknown[]> } | null
        setHasHooks(!!s?.hooks && Object.values(s.hooks).some((arr) => Array.isArray(arr) && arr.length > 0))
        setKnowledgeCount((kEntries as { total: number }).total || 0)
      } catch {
        if (!cancelled) setCommits([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    refreshStats()
    return () => { cancelled = true }
  }, [project?.path])

  if (!project) return <div />

  const setupItems: SetupItem[] = [
    {
      id: 'claude-md',
      icon: PenTool,
      label: 'CLAUDE.md',
      done: project.hasClaudeMd,
      view: 'claude-md'
    },
    {
      id: 'claude-dir',
      icon: FileText,
      label: '.claude/',
      done: project.hasClaudeDir
    },
    {
      id: 'agents',
      icon: Bot,
      label: t('nav.agents'),
      done: (projectStats?.agentCount || 0) > 0,
      view: 'agents',
      count: projectStats?.agentCount
    },
    {
      id: 'commands',
      icon: Zap,
      label: t('nav.commands'),
      done: (projectStats?.commandCount || 0) > 0,
      view: 'commands',
      count: projectStats?.commandCount
    },
    {
      id: 'skills',
      icon: Zap,
      label: t('nav.skills'),
      done: (projectStats?.skillCount || 0) > 0,
      view: 'skills',
      count: projectStats?.skillCount
    },
    {
      id: 'hooks',
      icon: Wrench,
      label: t('nav.hooks'),
      done: hasHooks,
      view: 'hooks'
    },
    {
      id: 'mcp',
      icon: Plug,
      label: t('nav.mcp'),
      done: (projectStats?.mcpServerCount || 0) > 0,
      view: 'mcp',
      count: projectStats?.mcpServerCount
    },
    {
      id: 'knowledge',
      icon: BookOpen,
      label: t('nav.knowledge'),
      done: knowledgeCount > 0,
      view: 'knowledge',
      count: knowledgeCount > 0 ? knowledgeCount : undefined
    }
  ]

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <GitBranch size={24} className="text-accent" />
            {t('timeline.title')}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {project.name} &mdash; {projectStats?.branch || 'main'}
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true)
            window.forgeApi.git.log(project.path, 50).then(setCommits).catch(() => {}).finally(() => setLoading(false))
            refreshStats()
          }}
          className="p-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
          title={t('timeline.refresh')}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Left: Commit Timeline */}
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
            <GitCommit size={14} />
            {t('timeline.recentActivity')}
          </h2>
          <CommitTimeline commits={commits} loading={loading} />
        </div>

        {/* Right: Project Progress */}
        <div className="space-y-4">
          <SetupChecklist items={setupItems} onNavigate={(v) => setView(v as Parameters<typeof setView>[0])} />

          {/* Quick stats */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t('timeline.stats')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">{t('timeline.totalCommits')}</span>
                <span className="text-text-primary font-mono">{commits.length}{commits.length >= 50 ? '+' : ''}</span>
              </div>
              {commits.length > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">{t('timeline.lastCommit')}</span>
                    <span className="text-text-primary text-xs">{commits[0].relativeDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">{t('timeline.authors')}</span>
                    <span className="text-text-primary font-mono">
                      {new Set(commits.map((c) => c.author)).size}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
