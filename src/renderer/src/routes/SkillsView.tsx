import { useState } from 'react'
import { Plus, Trash2, Save, Zap } from 'lucide-react'
import { useProjectData } from '../hooks/useProjectData'
import { useAppStore } from '../stores/app.store'
import { MarkdownEditor } from '../components/common/MarkdownEditor'
import { clsx } from 'clsx'
import type { SkillConfig } from '../../../shared/types/agent.types'

export function SkillsView(): React.ReactElement {
  const project = useAppStore((s) => s.project)
  const { data: skills, refresh } = useProjectData<SkillConfig[]>(
    (p) => window.forgeApi.skills.list(p)
  )
  const [selected, setSelected] = useState<SkillConfig | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [dirty, setDirty] = useState(false)

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
    await window.forgeApi.skills.save(project.path, { dirName, displayName: dirName, content: editContent, filePath: '' })
    setDirty(false)
    setIsNew(false)
    await refresh()
    const updated = await window.forgeApi.skills.list(project.path)
    const saved = updated.find((s: SkillConfig) => s.dirName === dirName)
    if (saved) handleSelect(saved)
  }

  const handleDelete = async (): Promise<void> => {
    if (!project || !selected) return
    await window.forgeApi.skills.delete(project.path, selected.dirName)
    setSelected(null)
    await refresh()
  }

  return (
    <div className="h-full flex">
      <div className="w-[260px] border-r border-border flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Skills</h2>
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
                  placeholder="skill-name (kebab-case)"
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
                  disabled={!dirty || (isNew && !newName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-bg rounded text-sm font-medium hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={14} /> Save
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <MarkdownEditor
                value={editContent}
                onChange={(v) => { setEditContent(v); setDirty(true) }}
                placeholder="Write the skill knowledge in Markdown..."
                minHeight={400}
              />
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-text-secondary text-sm">
            Select a skill or create a new one
          </div>
        )}
      </div>
    </div>
  )
}
