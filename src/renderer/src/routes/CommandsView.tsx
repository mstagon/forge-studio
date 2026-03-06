import { useState } from 'react'
import { Plus, Trash2, Save, Terminal } from 'lucide-react'
import { useProjectData } from '../hooks/useProjectData'
import { useAppStore } from '../stores/app.store'
import { MarkdownEditor } from '../components/common/MarkdownEditor'
import { clsx } from 'clsx'
import type { CommandConfig } from '../../../shared/types/agent.types'

export function CommandsView(): React.ReactElement {
  const project = useAppStore((s) => s.project)
  const { data: commands, refresh } = useProjectData<CommandConfig[]>(
    (p) => window.forgeApi.commands.list(p)
  )
  const [selected, setSelected] = useState<CommandConfig | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [dirty, setDirty] = useState(false)

  const handleSelect = (cmd: CommandConfig): void => {
    setSelected(cmd)
    setEditContent(cmd.content)
    setIsNew(false)
    setDirty(false)
  }

  const handleNew = (): void => {
    setSelected(null)
    setNewName('')
    setEditContent(`# Command Description\n\nDescribe what this command does.\n\n## Arguments\n\n- \`$ARGUMENTS\` — feature name or description\n\n## Steps\n\n1. Read the relevant spec from docs/specs/\n2. Execute the main action\n3. Report results\n\n## Output\n\nDescribe expected output.`)
    setIsNew(true)
    setDirty(true)
  }

  const handleSave = async (): Promise<void> => {
    if (!project) return
    const fileName = isNew ? newName.toLowerCase().replace(/\s+/g, '-') : selected!.fileName
    if (!fileName) return
    await window.forgeApi.commands.save(project.path, { fileName, displayName: fileName, content: editContent, filePath: '' })
    setDirty(false)
    setIsNew(false)
    await refresh()
    const updated = await window.forgeApi.commands.list(project.path)
    const saved = updated.find((c: CommandConfig) => c.fileName === fileName)
    if (saved) handleSelect(saved)
  }

  const handleDelete = async (): Promise<void> => {
    if (!project || !selected) return
    await window.forgeApi.commands.delete(project.path, selected.fileName)
    setSelected(null)
    await refresh()
  }

  return (
    <div className="h-full flex">
      <div className="w-[260px] border-r border-border flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Commands</h2>
          <button onClick={handleNew} className="p-1.5 rounded hover:bg-surface-hover text-text-secondary hover:text-accent transition-colors">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {(commands || []).map((cmd) => (
            <button
              key={cmd.fileName}
              onClick={() => handleSelect(cmd)}
              className={clsx(
                'w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2',
                selected?.fileName === cmd.fileName
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              )}
            >
              <Terminal size={14} />
              <span className="truncate">/{cmd.fileName}</span>
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
                  placeholder="command-name (kebab-case)"
                  className="bg-bg border border-border rounded px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              ) : (
                <h3 className="text-lg font-semibold text-text-primary font-mono">/{selected!.fileName}</h3>
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
                placeholder="Write the command instructions in Markdown..."
                minHeight={400}
              />
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-text-secondary text-sm">
            Select a command or create a new one
          </div>
        )}
      </div>
    </div>
  )
}
