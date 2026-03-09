import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Bot, List, GitBranch, Users, Search, Paintbrush } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useProjectData } from '../hooks/useProjectData'
import { useAppStore } from '../stores/app.store'
import { toast } from '../stores/toast.store'
import { MarkdownEditor } from '../components/common/MarkdownEditor'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { AgentGraph } from '../components/agents/AgentGraph'
import { clsx } from 'clsx'
import type { AgentConfig } from '../../../shared/types/agent.types'

const GROUP_COLORS: Record<string, string> = {
  planning: 'text-agent-plan border-agent-plan/30 bg-agent-plan/10',
  development: 'text-agent-dev border-agent-dev/30 bg-agent-dev/10',
  review: 'text-agent-review border-agent-review/30 bg-agent-review/10',
  documentation: 'text-agent-doc border-agent-doc/30 bg-agent-doc/10',
  custom: 'text-text-secondary border-border bg-surface'
}

export function AgentsView(): React.ReactElement {
  const { t } = useTranslation()
  const project = useAppStore((s) => s.project)
  const setDirtyView = useAppStore((s) => s.setDirtyView)
  const { data: agents, refresh } = useProjectData<AgentConfig[]>(
    (p) => window.forgeApi.agents.list(p)
  )
  const [selected, setSelected] = useState<AgentConfig | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list')

  useEffect(() => {
    setDirtyView(dirty)
  }, [dirty, setDirtyView])

  useEffect(() => {
    return () => setDirtyView(false)
  }, [setDirtyView])

  const handleDeselect = (): void => {
    setSelected(null)
    setIsNew(false)
    setEditContent('')
    setDirty(false)
  }

  const handleSelect = (agent: AgentConfig): void => {
    setSelected(agent)
    setEditContent(agent.content)
    setIsNew(false)
    setDirty(false)
  }

  const handleNew = (): void => {
    setSelected(null)
    setNewName('')
    setEditContent(`# New Agent\n\nYou are a specialized agent.\n\n## Role\n\nDescribe the agent's role here.\n\n## Rules\n\n- Rule 1\n- Rule 2\n\n## Output\n\nDescribe expected output format.`)
    setIsNew(true)
    setDirty(true)
  }

  const handleSave = async (): Promise<void> => {
    if (!project) return
    const fileName = isNew ? newName.toLowerCase().replace(/\s+/g, '-') : selected!.fileName
    if (!fileName) return

    setSaving(true)
    try {
      await window.forgeApi.agents.save(project.path, {
        fileName,
        displayName: fileName,
        group: 'custom',
        content: editContent,
        filePath: ''
      })
      setDirty(false)
      setIsNew(false)
      await refresh()

      // Select the saved agent
      const updated = await window.forgeApi.agents.list(project.path)
      const saved = updated.find((a: AgentConfig) => a.fileName === fileName)
      if (saved) handleSelect(saved)
      toast.success(t('agents.saved'))
    } catch (err) {
      toast.error(t('agents.saveFailed', { error: err instanceof Error ? err.message : String(err) }))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (): void => {
    if (!selected) return
    setConfirmDelete(selected.fileName)
  }

  const handleConfirmDelete = async (): Promise<void> => {
    if (!project || !confirmDelete) return
    try {
      await window.forgeApi.agents.delete(project.path, confirmDelete)
      setSelected(null)
      setIsNew(false)
      setDirty(false)
      await refresh()
      toast.success(t('agents.deleted'))
    } catch (err) {
      toast.error(t('agents.deleteFailed', { error: err instanceof Error ? err.message : String(err) }))
    } finally {
      setConfirmDelete(null)
    }
  }

  // Group agents
  const grouped = new Map<string, AgentConfig[]>()
  for (const agent of agents || []) {
    const list = grouped.get(agent.group) || []
    list.push(agent)
    grouped.set(agent.group, list)
  }

  return (
    <div className="h-full flex">
      {/* List */}
      <div className="w-[260px] border-r border-border flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <button
            onClick={handleDeselect}
            className={clsx(
              'text-sm font-semibold transition-colors',
              (selected || isNew) ? 'text-text-secondary hover:text-accent cursor-pointer' : 'text-text-primary cursor-default'
            )}
            disabled={!selected && !isNew}
          >
            {t('agents.title')}
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'graph' : 'list')}
              className="p-1.5 rounded hover:bg-surface-hover text-text-secondary hover:text-accent transition-colors"
              title={viewMode === 'list' ? t('agents.graphView') : t('agents.listView')}
            >
              {viewMode === 'list' ? <GitBranch size={16} /> : <List size={16} />}
            </button>
            <button onClick={handleNew} className="p-1.5 rounded hover:bg-surface-hover text-text-secondary hover:text-accent transition-colors">
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {['planning', 'development', 'review', 'documentation', 'custom'].map((group) => {
            const items = grouped.get(group)
            if (!items?.length) return null
            return (
              <div key={group} className="mb-3">
                <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-2 mb-1">
                  {t('agents.groups.' + group)}
                </div>
                {items.map((agent) => (
                  <button
                    key={agent.fileName}
                    onClick={() => handleSelect(agent)}
                    className={clsx(
                      'w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2',
                      selected?.fileName === agent.fileName
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    )}
                  >
                    <Bot size={14} />
                    <span className="truncate">{agent.displayName}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Editor / Graph */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {viewMode === 'graph' ? (
          <AgentGraph
            agents={agents || []}
            onSelectAgent={(agent) => { handleSelect(agent); setViewMode('list') }}
          />
        ) : (selected || isNew) ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3">
              {isNew ? (
                <input
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setDirty(true) }}
                  placeholder={t('agents.namePlaceholder')}
                  className="bg-bg border border-border rounded px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className={clsx('text-xs px-2 py-0.5 rounded border', GROUP_COLORS[selected!.group])}>
                    {t('agents.groups.' + selected!.group)}
                  </span>
                  <h3 className="text-lg font-semibold text-text-primary">{selected!.displayName}</h3>
                </div>
              )}
              <div className="ml-auto flex items-center gap-2">
                {!isNew && (
                  <button onClick={handleDelete} className="p-2 rounded hover:bg-error/10 text-text-secondary hover:text-error transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!dirty || saving || (isNew && !newName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-bg rounded text-sm font-medium hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={14} />
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <MarkdownEditor
                value={editContent}
                onChange={(v) => { setEditContent(v); setDirty(true) }}
                placeholder={t('agents.editorPlaceholder')}
                minHeight={400}
              />
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="max-w-md text-center px-6">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Bot size={24} className="text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {t('agents.emptyState.title')}
              </h3>
              <p className="text-sm text-text-secondary mb-6">
                {t('agents.emptyState.description')}
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-surface border border-border rounded-lg p-3 text-center">
                  <div className="w-8 h-8 rounded-full bg-agent-plan/10 flex items-center justify-center mx-auto mb-2">
                    <Search size={14} className="text-agent-plan" />
                  </div>
                  <div className="text-xs font-medium text-text-primary">{t('agents.emptyState.examplePlanner')}</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">{t('agents.emptyState.examplePlannerDesc')}</div>
                </div>
                <div className="bg-surface border border-border rounded-lg p-3 text-center">
                  <div className="w-8 h-8 rounded-full bg-agent-review/10 flex items-center justify-center mx-auto mb-2">
                    <Users size={14} className="text-agent-review" />
                  </div>
                  <div className="text-xs font-medium text-text-primary">{t('agents.emptyState.exampleReviewer')}</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">{t('agents.emptyState.exampleReviewerDesc')}</div>
                </div>
                <div className="bg-surface border border-border rounded-lg p-3 text-center">
                  <div className="w-8 h-8 rounded-full bg-agent-dev/10 flex items-center justify-center mx-auto mb-2">
                    <Paintbrush size={14} className="text-agent-dev" />
                  </div>
                  <div className="text-xs font-medium text-text-primary">{t('agents.emptyState.exampleUI')}</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">{t('agents.emptyState.exampleUIDesc')}</div>
                </div>
              </div>
              <button
                onClick={handleNew}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                <Plus size={14} />
                {t('agents.emptyState.createFirst')}
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={t('agents.deleteTitle')}
          message={t('agents.deleteMessage', { name: confirmDelete })}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
