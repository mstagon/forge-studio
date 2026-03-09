import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Zap, Code2, FileCode, FlaskConical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useProjectData } from '../hooks/useProjectData'
import { useAppStore } from '../stores/app.store'
import { toast } from '../stores/toast.store'
import { MarkdownEditor } from '../components/common/MarkdownEditor'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { clsx } from 'clsx'
import type { SkillConfig } from '../../../shared/types/agent.types'

export function SkillsView(): React.ReactElement {
  const { t } = useTranslation()
  const project = useAppStore((s) => s.project)
  const setDirtyView = useAppStore((s) => s.setDirtyView)
  const { data: skills, refresh } = useProjectData<SkillConfig[]>(
    (p) => window.forgeApi.skills.list(p)
  )
  const [selected, setSelected] = useState<SkillConfig | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

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

  const handleSelect = (skill: SkillConfig): void => {
    setSelected(skill)
    setEditContent(skill.content)
    setIsNew(false)
    setDirty(false)
  }

  const handleNew = (): void => {
    setSelected(null)
    setNewName('')
    setEditContent(`# Skill Name\n\nDescribe what knowledge this skill provides.\n\n## When to use\n\nDescribe when this skill should be activated.\n\n## Key patterns\n\n\`\`\`typescript\n// Example code pattern\n\`\`\`\n\n## Rules\n\n- Rule 1\n- Rule 2`)
    setIsNew(true)
    setDirty(true)
  }

  const handleSave = async (): Promise<void> => {
    if (!project) return
    const dirName = isNew ? newName.toLowerCase().replace(/\s+/g, '-') : selected!.dirName
    if (!dirName) return

    setSaving(true)
    try {
      await window.forgeApi.skills.save(project.path, { dirName, displayName: dirName, content: editContent, filePath: '' })
      setDirty(false)
      setIsNew(false)
      await refresh()
      const updated = await window.forgeApi.skills.list(project.path)
      const saved = updated.find((s: SkillConfig) => s.dirName === dirName)
      if (saved) handleSelect(saved)
      toast.success(t('skills.saved'))
    } catch (err) {
      toast.error(t('skills.saveFailed', { error: err instanceof Error ? err.message : String(err) }))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (): void => {
    if (!selected) return
    setConfirmDelete(selected.dirName)
  }

  const handleConfirmDelete = async (): Promise<void> => {
    if (!project || !confirmDelete) return
    try {
      await window.forgeApi.skills.delete(project.path, confirmDelete)
      setSelected(null)
      setDirty(false)
      await refresh()
      toast.success(t('skills.deleted'))
    } catch (err) {
      toast.error(t('skills.deleteFailed', { error: err instanceof Error ? err.message : String(err) }))
    } finally {
      setConfirmDelete(null)
    }
  }

  return (
    <div className="h-full flex">
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
            {t('skills.title')}
          </button>
          <button onClick={handleNew} className="p-1.5 rounded hover:bg-surface-hover text-text-secondary hover:text-accent transition-colors">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {(skills || []).map((skill) => (
            <button
              key={skill.dirName}
              onClick={() => handleSelect(skill)}
              className={clsx(
                'w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2',
                selected?.dirName === skill.dirName
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              )}
            >
              <Zap size={14} />
              <span className="truncate">{skill.displayName}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {(selected || isNew) ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3">
              {isNew ? (
                <input
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setDirty(true) }}
                  placeholder={t('skills.namePlaceholder')}
                  className="bg-bg border border-border rounded px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              ) : (
                <h3 className="text-lg font-semibold text-text-primary">{selected!.displayName}</h3>
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
                  <Save size={14} /> {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <MarkdownEditor
                value={editContent}
                onChange={(v) => { setEditContent(v); setDirty(true) }}
                placeholder={t('skills.editorPlaceholder')}
                minHeight={400}
              />
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="max-w-md text-center px-6">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Zap size={24} className="text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {t('skills.emptyState.title')}
              </h3>
              <p className="text-sm text-text-secondary mb-6">
                {t('skills.emptyState.description')}
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-surface border border-border rounded-lg p-3 text-center">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
                    <Code2 size={14} className="text-accent" />
                  </div>
                  <div className="text-xs font-medium text-text-primary">{t('skills.emptyState.exampleFreezed')}</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">{t('skills.emptyState.exampleFreezedDesc')}</div>
                </div>
                <div className="bg-surface border border-border rounded-lg p-3 text-center">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
                    <FileCode size={14} className="text-success" />
                  </div>
                  <div className="text-xs font-medium text-text-primary">{t('skills.emptyState.exampleApi')}</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">{t('skills.emptyState.exampleApiDesc')}</div>
                </div>
                <div className="bg-surface border border-border rounded-lg p-3 text-center">
                  <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-2">
                    <FlaskConical size={14} className="text-warning" />
                  </div>
                  <div className="text-xs font-medium text-text-primary">{t('skills.emptyState.exampleTest')}</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">{t('skills.emptyState.exampleTestDesc')}</div>
                </div>
              </div>
              <button
                onClick={handleNew}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                <Plus size={14} />
                {t('skills.emptyState.createFirst')}
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={t('skills.deleteTitle')}
          message={t('skills.deleteMessage', { name: confirmDelete })}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
