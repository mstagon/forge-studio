import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, FolderOpen, ChevronRight, Users, Play, Square, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useAppStore } from '../stores/app.store'
import { toast } from '../stores/toast.store'
import { clsx } from 'clsx'

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

export function PlanningView(): React.ReactElement {
  const { t } = useTranslation()
  const project = useAppStore((s) => s.project)
  const claudeInstalled = useAppStore((s) => s.claudeInstalled)
  const [docs, setDocs] = useState<DocFile[]>([])
  const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(null)
  const [content, setContent] = useState('')
  const [teamState, setTeamState] = useState<TeamRunState | null>(null)
  const [featureName, setFeatureName] = useState('')
  const [showTeam, setShowTeam] = useState(false)
  const [starting, setStarting] = useState(false)

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
    })
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

    for (const category of ['prd', 'specs', 'planningdocs', 'architecture', 'templates'] as const) {
      try {
        const entries = await window.forgeApi.project.readDir(`${project.path}/docs/${category}`)
        for (const entry of entries) {
          if (entry.name.endsWith('.md')) {
            allDocs.push({
              name: entry.name,
              path: `${project.path}/docs/${category}/${entry.name}`,
              category: category === 'specs' ? 'spec' : category as DocFile['category']
            })
          }
        }
      } catch {
        // directory doesn't exist
      }
    }
    setDocs(allDocs)
  }

  const handleSelect = async (doc: DocFile): Promise<void> => {
    setSelectedDoc(doc)
    try {
      const text = await window.forgeApi.fs.readFile(doc.path)
      setContent(text)
    } catch {
      setContent(t('planning.fileReadFailed'))
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
      const state = await window.forgeApi.team.start(project.path, featureName) as TeamRunState
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

  return (
    <div className="h-full flex">
      {/* Document list */}
      <div className="w-[260px] border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">{t('planning.title')}</h2>
            <button
              onClick={() => setShowTeam(!showTeam)}
              className={clsx(
                'p-1.5 rounded transition-colors',
                showTeam ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:text-accent hover:bg-surface-hover'
              )}
              title={t('planning.aiTeamTitle')}
            >
              <Users size={16} />
            </button>
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
        {showTeam ? (
          /* Team planning panel */
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-1">
                <Users size={20} className="text-accent" />
                {t('planning.aiTeamTitle')}
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                {t('planning.teamDescription')}
              </p>

              {/* Feature input */}
              <div className="mb-6">
                <label className="text-sm text-text-secondary block mb-2">{t('planning.featureName')}</label>
                <div className="flex gap-2">
                  <input
                    value={featureName}
                    onChange={(e) => setFeatureName(e.target.value)}
                    placeholder={t('planning.featureNamePlaceholder')}
                    disabled={isTeamRunning}
                    className="flex-1 bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
                  />
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
                {(teamState?.members ?? [
                  { role: 'Product Manager', status: 'pending', output: '' },
                  { role: 'Tech Architect', status: 'pending', output: '' },
                  { role: 'Task Decomposer', status: 'pending', output: '' }
                ]).map((member) => (
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
                  {t('planning.teamComplete')}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Document viewer */
          <div className="flex-1 overflow-y-auto">
            {selectedDoc ? (
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
                  <span>{t('planning.categories.' + selectedDoc.category)}</span>
                  <ChevronRight size={14} />
                  <span className="text-text-primary">{selectedDoc.name}</span>
                </div>
                <pre className="text-sm text-text-primary font-mono whitespace-pre-wrap leading-relaxed">
                  {content}
                </pre>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <FileText size={48} className="text-text-secondary mx-auto mb-4 opacity-20" />
                  <p className="text-text-secondary mb-4">{t('planning.selectDoc')}</p>
                  <button
                    onClick={() => setShowTeam(true)}
                    className="flex items-center gap-2 mx-auto px-4 py-2.5 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                  >
                    <Users size={16} />
                    {t('planning.startAiTeam')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
