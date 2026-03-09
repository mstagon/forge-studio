import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, AlertTriangle, CheckCircle2, Plus, Search, Upload, Trash2, Database, ArrowUpCircle, X, Pencil } from 'lucide-react'
import { useAppStore } from '../stores/app.store'
import { toast } from '../stores/toast.store'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { clsx } from 'clsx'

interface KnowledgeEntry {
  id: number
  projectPath: string
  category: 'lesson' | 'pattern' | 'decision' | 'tip'
  title: string
  content: string
  tags: string
  repeatCount: number
  createdAt: string
  updatedAt: string
}

interface EscalationResult {
  candidates: KnowledgeEntry[]
  applied: string[]
  skipped: string[]
}

const CATEGORY_COLORS: Record<string, string> = {
  lesson: 'bg-warning/10 text-warning border-warning/20',
  pattern: 'bg-accent/10 text-accent border-accent/20',
  decision: 'bg-success/10 text-success border-success/20',
  tip: 'bg-agent-doc/10 text-agent-doc border-agent-doc/20'
}

export function KnowledgeView(): React.ReactElement {
  const { t } = useTranslation()
  const project = useAppStore((s) => s.project)
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [showAdd, setShowAdd] = useState(false)
  const [escalation, setEscalation] = useState<EscalationResult | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editCategory, setEditCategory] = useState('')

  // Add form state
  const [addTitle, setAddTitle] = useState('')
  const [addContent, setAddContent] = useState('')
  const [addCategory, setAddCategory] = useState<string>('lesson')
  const [addTags, setAddTags] = useState('')

  const load = async (): Promise<void> => {
    if (!project) return
    const result = await window.forgeApi.knowledge.search({
      projectPath: project.path,
      ...(filterCategory ? { category: filterCategory } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      limit: 100
    })
    setEntries(result.entries)
    setTotal(result.total)
  }

  useEffect(() => { load() }, [project?.path, filterCategory, searchQuery])

  const handleAdd = async (): Promise<void> => {
    if (!project || !addTitle) return
    try {
      await window.forgeApi.knowledge.add({
        projectPath: project.path,
        category: addCategory,
        title: addTitle,
        content: addContent,
        tags: addTags.split(',').map((t: string) => t.trim()).filter(Boolean)
      })
      toast.success(t('knowledge.entryAdded'))
      setShowAdd(false)
      setAddTitle('')
      setAddContent('')
      setAddTags('')
      load()
    } catch (err) {
      toast.error(t('knowledge.addFailed', { error: err instanceof Error ? err.message : String(err) }))
    }
  }

  const handleDelete = async (id: number): Promise<void> => {
    try {
      await window.forgeApi.knowledge.delete(id)
      toast.success(t('knowledge.entryDeleted'))
      setConfirmDelete(null)
      load()
    } catch (err) {
      toast.error(t('knowledge.deleteFailed', { error: err instanceof Error ? err.message : String(err) }))
    }
  }

  const handleImportLessons = async (): Promise<void> => {
    if (!project) return
    try {
      const content = await window.forgeApi.fs.readFile(`${project.path}/docs/lessons-learned.md`)
      const count = await window.forgeApi.knowledge.importLessons(project.path, content)
      load()
      toast.success(t('knowledge.lessonsImported', { count }))
    } catch {
      toast.error(t('knowledge.lessonsFileNotFound'))
    }
  }

  const startEdit = (entry: KnowledgeEntry): void => {
    setEditingId(entry.id)
    setEditTitle(entry.title)
    setEditContent(entry.content)
    setEditTags(entry.tags)
    setEditCategory(entry.category)
  }

  const handleUpdate = async (): Promise<void> => {
    if (editingId === null || !editTitle) return
    try {
      await window.forgeApi.knowledge.update(editingId, {
        title: editTitle,
        content: editContent,
        tags: editTags.split(',').map((t: string) => t.trim()).filter(Boolean),
        category: editCategory
      })
      toast.success(t('knowledge.entryUpdated'))
      setEditingId(null)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const handleCheckEscalation = async (): Promise<void> => {
    if (!project) return
    try {
      const result = await window.forgeApi.knowledge.getEscalation(project.path)
      setEscalation(result)
    } catch (err) {
      toast.error(t('knowledge.escalationCheckFailed', { error: err instanceof Error ? err.message : String(err) }))
    }
  }

  const handleApplyEscalation = async (): Promise<void> => {
    if (!project || !escalation) return
    try {
      const toApply = escalation.candidates.filter((c) => escalation.applied.includes(c.title))
      const count = await window.forgeApi.knowledge.applyEscalation(project.path, toApply)
      toast.success(t('knowledge.rulesAdded', { count }))
      setEscalation(null)
    } catch (err) {
      toast.error(t('knowledge.escalationApplyFailed', { error: err instanceof Error ? err.message : String(err) }))
    }
  }

  const repeats = entries.filter((e) => e.repeatCount >= 3)
  const learningRate = entries.length > 0
    ? Math.round((entries.filter((e) => e.repeatCount < 3).length / entries.length) * 100)
    : 100

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <BookOpen size={20} className="text-text-secondary" />
        <h2 className="text-lg font-semibold text-text-primary">{t('knowledge.title')}</h2>
        <div className="flex items-center gap-1 ml-1">
          <Database size={12} className="text-accent" />
          <span className="text-xs text-accent">{t('knowledge.dbType')}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleImportLessons}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-primary border border-border rounded transition-colors"
          >
            <Upload size={12} /> {t('knowledge.importLessons')}
          </button>
          <button
            onClick={handleCheckEscalation}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-warning border border-warning/30 rounded hover:bg-warning/5 transition-colors"
          >
            <ArrowUpCircle size={12} /> {t('knowledge.checkEscalation')}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-bg rounded text-xs font-medium hover:bg-accent/90 transition-colors"
          >
            <Plus size={12} /> {t('common.add')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6 max-w-3xl">
          <div className="bg-surface border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-text-primary">{total}</div>
            <div className="text-xs text-text-secondary">{t('knowledge.totalEntries')}</div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-warning">{repeats.length}</div>
            <div className="text-xs text-text-secondary">{t('knowledge.repeats')}</div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-success">{learningRate}%</div>
            <div className="text-xs text-text-secondary">{t('knowledge.learningRate')}</div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-accent">
              {new Set(entries.flatMap((e) => e.tags.split(',').filter(Boolean))).size}
            </div>
            <div className="text-xs text-text-secondary">{t('knowledge.uniqueTags')}</div>
          </div>
        </div>

        {/* Escalation report */}
        {escalation && escalation.candidates.length > 0 && (
          <div className="mb-6 max-w-3xl bg-warning/5 border border-warning/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-warning flex items-center gap-2">
                <AlertTriangle size={14} />
                {t('knowledge.escalationTitle', { count: escalation.candidates.length })}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setEscalation(null)} className="text-xs text-text-secondary hover:text-text-primary">
                  {t('common.dismiss')}
                </button>
                {escalation.applied.length > 0 && (
                  <button
                    onClick={handleApplyEscalation}
                    className="text-xs bg-warning text-bg px-3 py-1 rounded font-medium hover:bg-warning/90"
                  >
                    {t('knowledge.applyEscalation', { count: escalation.applied.length })}
                  </button>
                )}
              </div>
            </div>
            {escalation.candidates.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-text-primary">{c.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-warning">{c.repeatCount}x</span>
                  {escalation.skipped.includes(c.title) ? (
                    <span className="text-[10px] text-text-secondary">{t('knowledge.alreadyInRules')}</span>
                  ) : (
                    <span className="text-[10px] text-success">{t('knowledge.willAdd')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {showAdd && (
          <div className="mb-6 max-w-3xl bg-surface border border-accent/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary">{t('knowledge.addTitle')}</h3>
              <button onClick={() => setShowAdd(false)} className="text-text-secondary hover:text-text-primary">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-text-secondary block mb-1">{t('knowledge.titleLabel')}</label>
                  <input
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary block mb-1">{t('knowledge.category')}</label>
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value)}
                    className="bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none"
                  >
                    <option value="lesson">{t('knowledge.categories.lesson')}</option>
                    <option value="pattern">{t('knowledge.categories.pattern')}</option>
                    <option value="decision">{t('knowledge.categories.decision')}</option>
                    <option value="tip">{t('knowledge.categories.tip')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">{t('knowledge.content')}</label>
                <textarea
                  value={addContent}
                  onChange={(e) => setAddContent(e.target.value)}
                  rows={3}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">{t('knowledge.tagsLabel')}</label>
                <input
                  value={addTags}
                  onChange={(e) => setAddTags(e.target.value)}
                  placeholder={t('knowledge.tagsPlaceholder')}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={!addTitle}
                className="px-4 py-2 bg-accent text-bg rounded text-sm font-medium hover:bg-accent/90 disabled:opacity-30 transition-colors"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex items-center gap-3 mb-4 max-w-3xl">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('knowledge.searchPlaceholder')}
              className="w-full bg-bg border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-1">
            {['', 'lesson', 'pattern', 'decision', 'tip'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={clsx(
                  'px-2.5 py-1.5 rounded text-xs transition-colors',
                  filterCategory === cat
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                )}
              >
                {cat ? t(`knowledge.categories.${cat}`) : t('knowledge.filterAll')}
              </button>
            ))}
          </div>
        </div>

        {/* Entries list */}
        <div className="max-w-3xl space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-text-secondary text-sm">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen size={24} className="text-accent" />
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-2">
                {t('knowledge.emptyStateTitle')}
              </h3>
              <p className="text-sm text-text-secondary max-w-sm mx-auto mb-3">
                {t('knowledge.emptyStateDescription')}
              </p>
              <p className="text-xs text-text-secondary">{t('knowledge.emptyStateHint')}</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="bg-surface border border-border rounded-lg p-4 group">
                {editingId === entry.id ? (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none"
                      >
                        <option value="lesson">{t('knowledge.categories.lesson')}</option>
                        <option value="pattern">{t('knowledge.categories.pattern')}</option>
                        <option value="decision">{t('knowledge.categories.decision')}</option>
                        <option value="tip">{t('knowledge.categories.tip')}</option>
                      </select>
                    </div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent resize-none"
                    />
                    <input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder={t('knowledge.tagsPlaceholder')}
                      className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdate}
                        disabled={!editTitle}
                        className="px-3 py-1.5 bg-accent text-bg rounded text-xs font-medium hover:bg-accent/90 disabled:opacity-30"
                      >
                        {t('common.save')}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary border border-border rounded"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {entry.repeatCount >= 3 ? (
                          <AlertTriangle size={14} className="text-warning" />
                        ) : (
                          <CheckCircle2 size={14} className="text-success" />
                        )}
                        <span className="text-sm font-medium text-text-primary">{entry.title}</span>
                        <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border', CATEGORY_COLORS[entry.category])}>
                          {entry.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.repeatCount > 1 && (
                          <span className="text-xs bg-warning/10 text-warning px-1.5 py-0.5 rounded">{entry.repeatCount}x</span>
                        )}
                        <span className="text-xs text-text-secondary">{entry.updatedAt?.slice(0, 10)}</span>
                        <button
                          onClick={() => startEdit(entry)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent/10 text-text-secondary hover:text-accent transition-all"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(entry.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-error/10 text-text-secondary hover:text-error transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {entry.content && (
                      <div className="text-xs text-text-secondary whitespace-pre-wrap">{entry.content}</div>
                    )}
                    {entry.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.split(',').filter(Boolean).map((tag) => (
                          <span key={tag} className="text-[10px] bg-bg px-1.5 py-0.5 rounded text-text-secondary">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {confirmDelete !== null && (
        <ConfirmDialog
          title={t('knowledge.deleteTitle')}
          message={t('knowledge.deleteMessage')}
          confirmLabel={t('common.delete')}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
