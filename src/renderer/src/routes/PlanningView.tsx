import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, FolderOpen, ChevronRight, Users, Play, Square, Loader2, CheckCircle2, XCircle, Layers, Puzzle, Upload, ChevronDown, ArrowRight, GitBranch } from 'lucide-react'
import { useAppStore } from '../stores/app.store'
import { toast } from '../stores/toast.store'
import { clsx } from 'clsx'

type TeamMode = 'project' | 'feature'

const DOC_CATEGORIES = ['planning', 'prd', 'specs', 'planningdocs', 'architecture', 'templates'] as const
type ImportCategory = 'planning' | 'prd' | 'specs' | 'architecture'

interface DocFile {
  name: string
  path: string
  category: 'prd' | 'spec' | 'planningdocs' | 'architecture' | 'templates'
}

interface TeamMemberStatus {
  role: string
  agent: string
  prompt: string
  status: 'pending' | 'running' | 'done' | 'failed' | 'skipped'
  output: string
}

interface TeamRunState {
  id: string
  featureName: string
  members: TeamMemberStatus[]
  currentMember: number
  status: 'idle' | 'running' | 'done' | 'failed'
}

const PROJECT_TEAM_PLACEHOLDER: TeamMemberStatus[] = [
  { role: 'Product Strategist', agent: '', prompt: '', status: 'pending', output: '' },
  { role: 'System Architect', agent: '', prompt: '', status: 'pending', output: '' },
  { role: 'Feature Planner', agent: '', prompt: '', status: 'pending', output: '' }
]

const FEATURE_TEAM_PLACEHOLDER: TeamMemberStatus[] = [
  { role: 'Product Manager', agent: '', prompt: '', status: 'pending', output: '' },
  { role: 'Tech Architect', agent: '', prompt: '', status: 'pending', output: '' },
  { role: 'Task Decomposer', agent: '', prompt: '', status: 'pending', output: '' }
]

export function useDetectedFeatures(): string[] {
  const project = useAppStore((s) => s.project)
  const [features, setFeatures] = useState<string[]>([])

  const detect = useCallback(async () => {
    if (!project) { setFeatures([]); return }
    const names = new Set<string>()

    // 1) docs/prd/*.md → feature name from filename
    try {
      const entries = await window.forgeApi.project.readDir(`${project.path}/docs/prd`)
      for (const e of entries) {
        if (e.name.endsWith('.md')) names.add(e.name.replace(/\.md$/, ''))
      }
    } catch { /* no prd dir */ }

    // 2) docs/specs/*-spec.md, *-tasks.md → feature name from filename
    try {
      const entries = await window.forgeApi.project.readDir(`${project.path}/docs/specs`)
      for (const e of entries) {
        const m = e.name.match(/^(.+)-spec\.md$/)
        if (m) names.add(m[1])
        const t = e.name.match(/^(.+)-tasks\.md$/)
        if (t) names.add(t[1])
      }
    } catch { /* no specs dir */ }

    // 3) docs/planning/feature-roadmap.md → parse features generously
    try {
      const roadmap = await window.forgeApi.fs.readFile(`${project.path}/docs/planning/feature-roadmap.md`)
      const skipPattern = /^(milestone|phase|overview|summary|dependencies|roadmap|implementation|priority|appendix|introduction|conclusion|table|note|feature)/i
      const lines = roadmap.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()

        // ## Feature Name, ### 1. Feature Name, ## 2) Feature-Name
        const heading = trimmed.match(/^#{2,4}\s+(?:\d+[\.\)]\s*)?(.+)/)
        if (heading) {
          const raw = heading[1].replace(/\*\*/g, '').replace(/`/g, '').replace(/\(.*?\)/g, '').trim()
          if (!skipPattern.test(raw) && raw.length > 1) {
            const slug = raw.toLowerCase().replace(/[^a-z0-9가-힣\s_-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
            if (slug.length > 1 && slug.length < 80) names.add(slug)
          }
        }

        // - **Feature Name**: desc / - Feature Name — desc / - feature-name (priority)
        // * Feature Name - desc / 1. Feature Name
        const listItem = trimmed.match(/^(?:[-*]|\d+[\.\)])\s+\*{0,2}(.+?)\*{0,2}\s*(?:[:\-—|(]|$)/)
        if (listItem && !heading) {
          const raw = listItem[1].replace(/`/g, '').trim()
          if (!skipPattern.test(raw) && raw.length > 1 && raw.length < 80) {
            const slug = raw.toLowerCase().replace(/[^a-z0-9가-힣\s_-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
            if (slug.length > 1) names.add(slug)
          }
        }
      }
    } catch { /* no roadmap */ }

    setFeatures(Array.from(names).sort())
  }, [project?.path])

  useEffect(() => { detect() }, [detect])

  return features
}

interface FeatureComboboxProps {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  placeholder?: string
  features: string[]
}

function FeatureCombobox({ value, onChange, disabled, placeholder, features }: FeatureComboboxProps): React.ReactElement {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <div className="relative flex-1">
      <div className="flex">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent disabled:opacity-50 pr-9"
        />
        {features.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            disabled={disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-accent disabled:opacity-50 transition-colors"
          >
            <ChevronDown size={14} />
          </button>
        )}
      </div>
      {open && features.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-20 max-h-[200px] overflow-y-auto">
            {features.length === 0 && (
              <div className="px-3 py-2 text-xs text-text-secondary">{t('planning.noFeaturesDetected')}</div>
            )}
            {features.map((f) => (
              <button
                key={f}
                onClick={() => { onChange(f); setOpen(false) }}
                className={clsx(
                  'w-full text-left px-3 py-2 text-sm transition-colors hover:bg-surface-hover',
                  f === value ? 'text-accent bg-accent/5' : 'text-text-primary'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function PlanningView(): React.ReactElement {
  const { t } = useTranslation()
  const project = useAppStore((s) => s.project)
  const setView = useAppStore((s) => s.setView)
  const claudeInstalled = useAppStore((s) => s.claudeInstalled)
  const [docs, setDocs] = useState<DocFile[]>([])
  const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(null)
  const [content, setContent] = useState('')
  const [teamState, setTeamState] = useState<TeamRunState | null>(null)
  const [featureName, setFeatureName] = useState('')
  const [showTeam, setShowTeam] = useState(false)
  const [starting, setStarting] = useState(false)
  const [teamMode, setTeamMode] = useState<TeamMode>('project')
  const [hasProjectDocs, setHasProjectDocs] = useState(false)
  const [importCategory, setImportCategory] = useState<ImportCategory>('planning')
  const [showImportCategory, setShowImportCategory] = useState(false)
  const features = useDetectedFeatures()

  useEffect(() => {
    if (!project) return
    loadDocs()
  }, [project?.path])

  // Team state listener
  useEffect(() => {
    const unsub = window.forgeApi.team.onState((state) => {
      setTeamState(state as TeamRunState)
    })
    window.forgeApi.team.getState().then((state) => {
      if (state) setTeamState(state as TeamRunState)
    }).catch(() => {})
    return unsub
  }, [])

  // Team output listener
  useEffect(() => {
    const unsub = window.forgeApi.team.onOutput((_tId, role, data) => {
      setTeamState((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          members: prev.members.map((m) =>
            m.role === role ? { ...m, output: m.output + data } : m
          )
        }
      })
    })
    return unsub
  }, [])

  // Reload docs when team finishes
  useEffect(() => {
    if (teamState?.status === 'done') loadDocs()
  }, [teamState?.status])

  const loadDocs = async (): Promise<void> => {
    if (!project) return
    const allDocs: DocFile[] = []
    let foundProjectDocs = false

    for (const category of DOC_CATEGORIES) {
      try {
        const entries = await window.forgeApi.project.readDir(`${project.path}/docs/${category}`)
        const mapped = category === 'planning' ? 'planningdocs'
          : category === 'specs' ? 'spec'
          : category as DocFile['category']
        for (const entry of entries) {
          if (entry.name.endsWith('.md')) {
            allDocs.push({
              name: entry.name,
              path: `${project.path}/docs/${category}/${entry.name}`,
              category: mapped
            })
            if (category === 'planning') foundProjectDocs = true
          }
        }
      } catch {
        // directory doesn't exist
      }
    }
    setDocs(allDocs)
    setHasProjectDocs(foundProjectDocs)
  }

  const handleSelect = async (doc: DocFile): Promise<void> => {
    // Clicking the already-selected doc deselects it
    if (selectedDoc?.path === doc.path) {
      setSelectedDoc(null)
      setContent('')
      return
    }
    setSelectedDoc(doc)
    setShowTeam(false) // Always switch to doc viewer
    try {
      const text = await window.forgeApi.fs.readFile(doc.path)
      setContent(text)
    } catch {
      setContent(t('planning.fileReadFailed'))
    }
  }

  const handleImport = async (): Promise<void> => {
    if (!project) return
    const files = await window.forgeApi.app.openFiles()
    if (files.length === 0) return

    const destDir = `${project.path}/docs/${importCategory}`
    let imported = 0
    for (const filePath of files) {
      const fileName = filePath.split('/').pop() ?? filePath.split('\\').pop() ?? 'unknown'
      try {
        await window.forgeApi.fs.copyFile(filePath, destDir, fileName)
        imported++
      } catch {
        toast.error(t('planning.importFailed', { file: fileName }))
      }
    }
    if (imported > 0) {
      toast.success(t('planning.importSuccess', { count: imported }))
      loadDocs()
    }
  }

  const handleStartTeam = async (): Promise<void> => {
    if (!project || !featureName) return
    if (!claudeInstalled) {
      toast.error(t('planning.claudeNotInstalled'))
      return
    }
    setStarting(true)
    try {
      const state = await window.forgeApi.team.start(project.path, featureName, teamMode) as TeamRunState
      setTeamState(state)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('planning.failedToStart'))
    } finally {
      setStarting(false)
    }
  }

  const handleStopTeam = async (): Promise<void> => {
    await window.forgeApi.team.stop()
  }

  const isTeamRunning = teamState?.status === 'running'

  // Group by category
  const grouped = new Map<string, DocFile[]>()
  for (const doc of docs) {
    const list = grouped.get(doc.category) || []
    list.push(doc)
    grouped.set(doc.category, list)
  }

  const importCategoryLabels: Record<ImportCategory, string> = {
    planning: t('planning.categories.planningdocs'),
    prd: t('planning.categories.prd'),
    specs: t('planning.categories.spec'),
    architecture: t('planning.categories.architecture')
  }

  return (
    <div className="h-full flex">
      {/* Document list */}
      <div className="w-[260px] border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">{t('planning.title')}</h2>
            {/* Import button with category selector */}
            <div className="relative">
              <button
                onClick={() => setShowImportCategory(!showImportCategory)}
                className="p-1.5 rounded transition-colors text-text-secondary hover:text-accent hover:bg-surface-hover"
                title={t('planning.importDocs')}
              >
                <Upload size={16} />
              </button>
              {showImportCategory && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowImportCategory(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg z-20 min-w-[160px]">
                    <div className="px-3 py-2 text-xs text-text-secondary border-b border-border">
                      {t('planning.importTo')}
                    </div>
                    {(Object.keys(importCategoryLabels) as ImportCategory[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setImportCategory(cat)
                          setShowImportCategory(false)
                          handleImport()
                        }}
                        className={clsx(
                          'w-full text-left px-3 py-2 text-sm transition-colors hover:bg-surface-hover',
                          cat === importCategory ? 'text-accent' : 'text-text-primary'
                        )}
                      >
                        {importCategoryLabels[cat]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-1">{t('planning.docsDir')}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {docs.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-sm">
              <FolderOpen size={24} className="mx-auto mb-2 opacity-30" />
              <p>{t('planning.emptyDocs')}</p>
              <p className="text-xs mt-1">{t('planning.emptyDocsHint')}</p>
            </div>
          ) : (
            ['prd', 'spec', 'planningdocs', 'architecture', 'templates'].map((cat) => {
              const items = grouped.get(cat)
              if (!items?.length) return null
              return (
                <div key={cat} className="mb-3">
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-2 mb-1">
                    {t('planning.categories.' + cat)}
                  </div>
                  {items.map((doc) => (
                    <button
                      key={doc.path}
                      onClick={() => handleSelect(doc)}
                      className={clsx(
                        'w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2',
                        selectedDoc?.path === doc.path
                          ? 'bg-accent/10 text-accent'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                      )}
                    >
                      <FileText size={14} />
                      <span className="truncate">{doc.name}</span>
                    </button>
                  ))}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top tab bar — always visible */}
        <div className="px-4 py-2 border-b border-border flex items-center justify-between">
          <div className="flex gap-1 bg-surface rounded-lg p-0.5">
            <button
              onClick={() => setShowTeam(false)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                !showTeam ? 'bg-bg text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <FileText size={13} />
              {t('planning.tab.docs')}
            </button>
            <button
              onClick={() => setShowTeam(true)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                showTeam ? 'bg-bg text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Users size={13} />
              {t('planning.tab.aiTeam')}
            </button>
          </div>
          {selectedDoc && !showTeam && (
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span>{t('planning.categories.' + selectedDoc.category)}</span>
              <ChevronRight size={12} />
              <span className="text-text-primary">{selectedDoc.name}</span>
            </div>
          )}
        </div>

        {showTeam ? (
          /* Team planning panel */
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl">
              {/* Mode tabs (project / feature) */}
              <div className="flex gap-1 mb-6 bg-surface rounded-lg p-1 w-fit">
                <button
                  onClick={() => { if (!isTeamRunning) setTeamMode('project') }}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    teamMode === 'project'
                      ? 'bg-bg text-accent shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Layers size={14} />
                  {t('planning.mode.project')}
                </button>
                <button
                  onClick={() => { if (!isTeamRunning) setTeamMode('feature') }}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    teamMode === 'feature'
                      ? 'bg-bg text-accent shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Puzzle size={14} />
                  {t('planning.mode.feature')}
                </button>
              </div>

              <p className="text-sm text-text-secondary mb-4">
                {teamMode === 'project' ? t('planning.projectDescription') : t('planning.teamDescription')}
              </p>

              {/* Hint: project docs recommended first */}
              {teamMode === 'feature' && !hasProjectDocs && (
                <div className="mb-4 bg-warning/5 border border-warning/20 rounded-lg px-4 py-3 text-xs text-text-secondary">
                  {t('planning.projectDocsHint')}
                </div>
              )}

              {/* Name input */}
              <div className="mb-6">
                <label className="text-sm text-text-secondary block mb-2">
                  {teamMode === 'project' ? t('planning.projectName') : t('planning.featureName')}
                </label>
                <div className="flex gap-2">
                  {teamMode === 'feature' ? (
                    <FeatureCombobox
                      value={featureName}
                      onChange={setFeatureName}
                      disabled={isTeamRunning}
                      placeholder={t('planning.featureNamePlaceholder')}
                      features={features}
                    />
                  ) : (
                    <input
                      value={featureName}
                      onChange={(e) => setFeatureName(e.target.value)}
                      placeholder={t('planning.projectNamePlaceholder')}
                      disabled={isTeamRunning}
                      className="flex-1 bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
                    />
                  )}
                  {isTeamRunning ? (
                    <button
                      onClick={handleStopTeam}
                      className="flex items-center gap-2 px-4 py-2.5 bg-error text-white rounded-lg text-sm font-medium hover:bg-error/90 transition-colors"
                    >
                      <Square size={14} /> {t('common.stop')}
                    </button>
                  ) : (
                    <button
                      onClick={handleStartTeam}
                      disabled={!featureName || !project || starting}
                      className="flex items-center gap-2 px-4 py-2.5 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      {starting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} {t('planning.startTeam')}
                    </button>
                  )}
                </div>
              </div>

              {/* Team members status */}
              <div className="space-y-3">
                {(teamState?.members ?? (teamMode === 'project' ? PROJECT_TEAM_PLACEHOLDER : FEATURE_TEAM_PLACEHOLDER)).map((member) => (
                  <div
                    key={member.role}
                    className={clsx(
                      'border rounded-lg p-4 transition-colors',
                      member.status === 'running' ? 'bg-accent/5 border-accent/30' :
                      member.status === 'done' ? 'bg-success/5 border-success/20' :
                      member.status === 'failed' ? 'bg-error/5 border-error/20' :
                      'bg-surface border-border'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {(member.status === 'done' || member.status === 'skipped') && <CheckCircle2 size={18} className="text-success" />}
                      {member.status === 'running' && <Loader2 size={18} className="text-accent animate-spin" />}
                      {member.status === 'failed' && <XCircle size={18} className="text-error" />}
                      {member.status === 'pending' && <div className="w-[18px] h-[18px] rounded-full border-2 border-text-secondary/30" />}

                      <div className="flex-1">
                        <div className="text-sm font-medium text-text-primary">{member.role}</div>
                        <div className="text-xs text-text-secondary">
                          {member.status === 'running' ? t('planning.status.working') :
                           member.status === 'done' ? t('planning.status.completed') :
                           member.status === 'skipped' ? t('planning.status.skipped') :
                           member.status === 'failed' ? t('planning.status.failed') : t('planning.status.waiting')}
                        </div>
                      </div>

                      {member.status === 'done' && member.output && (
                        <span className="text-[10px] text-text-secondary">
                          {Math.round(member.output.length / 1000)}KB output
                        </span>
                      )}
                    </div>

                    {member.status === 'running' && member.output && (
                      <pre className="mt-3 bg-[#0d1117] rounded p-3 text-xs text-green-400 font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                        {member.output.slice(-2000)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>

              {teamState?.status === 'done' && (
                <div className="mt-6 bg-success/5 border border-success/20 rounded-lg p-4 text-sm text-text-primary">
                  {teamMode === 'project' ? t('planning.projectComplete') : t('planning.teamComplete')}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => setView('workflow')}
                      className="flex items-center gap-2 px-3 py-1.5 bg-accent text-bg rounded text-xs font-medium hover:bg-accent/90 transition-colors"
                    >
                      <GitBranch size={12} />
                      {t('planning.goToWorkflow')}
                      <ArrowRight size={12} />
                    </button>
                    {teamMode === 'project' && (
                      <button
                        onClick={() => { setTeamMode('feature'); setTeamState(null); setFeatureName('') }}
                        className="flex items-center gap-2 px-3 py-1.5 border border-border text-text-secondary rounded text-xs font-medium hover:text-text-primary transition-colors"
                      >
                        <Puzzle size={12} />
                        {t('planning.goToFeaturePlanning')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Document viewer */
          <div className="flex-1 overflow-y-auto">
            {selectedDoc ? (
              <div className="p-6">
                <pre className="text-sm text-text-primary font-mono whitespace-pre-wrap leading-relaxed">
                  {content}
                </pre>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <FileText size={48} className="text-text-secondary mx-auto mb-4 opacity-20" />
                  <p className="text-text-secondary mb-4">{t('planning.selectDoc')}</p>
                  <div className="flex items-center gap-3 justify-center">
                    <button
                      onClick={() => setShowTeam(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                    >
                      <Users size={16} />
                      {t('planning.startAiTeam')}
                    </button>
                    <button
                      onClick={handleImport}
                      className="flex items-center gap-2 px-4 py-2.5 border border-border text-text-secondary rounded-lg text-sm font-medium hover:text-text-primary hover:border-accent transition-colors"
                    >
                      <Upload size={16} />
                      {t('planning.importDocs')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
