import { useState } from 'react'
import { Plus, Trash2, Save, Bot } from 'lucide-react'
import { useProjectData } from '../hooks/useProjectData'
import { useAppStore } from '../stores/app.store'
import { MarkdownEditor } from '../components/common/MarkdownEditor'
import { clsx } from 'clsx'
import type { AgentConfig } from '../../../shared/types/agent.types'

const GROUP_COLORS: Record<string, string> = {
  planning: 'text-agent-plan border-agent-plan/30 bg-agent-plan/10',
  development: 'text-agent-dev border-agent-dev/30 bg-agent-dev/10',
  review: 'text-agent-review border-agent-review/30 bg-agent-review/10',
  documentation: 'text-agent-doc border-agent-doc/30 bg-agent-doc/10',
  custom: 'text-text-secondary border-border bg-surface'
}

const GROUP_LABELS: Record<string, string> = {
  planning: 'Planning',
  development: 'Development',
  review: 'Review',
  documentation: 'Documentation',
  custom: 'Custom'
}

export function AgentsView(): React.ReactElement {
  const project = useAppStore((s) => s.project)
  const { data: agents, refresh } = useProjectData<AgentConfig[]>(
    (p) => window.forgeApi.agents.list(p)
  )
  const [selected, setSelected] = useState<AgentConfig | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [dirty, setDirty] = useState(false)

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

    await window.forgeApi.agents.save(project.path, {
      fileName,
      displayName: fileName,
      group: 'custom',
      content: editContent,
      filePath: '',
      isActive: true
    })
    setDirty(false)
    setIsNew(false)
    await refresh()

    // Select the saved agent
    const updated = await window.forgeApi.agents.list(project.path)
    const saved = updated.find((a: AgentConfig) => a.fileName === fileName)
    if (saved) handleSelect(saved)
  }

  const handleDelete = async (): Promise<void> => {
    if (!project || !selected) return
    await window.forgeApi.agents.delete(project.path, selected.fileName)
    setSelected(null)
    setIsNew(false)
    await refresh()
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
          <h2 className="text-sm font-semibold text-text-primary">Agents</h2>
          <button onClick={handleNew} className="p-1.5 rounded hover:bg-surface-hover text-text-secondary hover:text-accent transition-colors">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {['planning', 'development', 'review', 'documentation', 'custom'].map((group) => {
            const items = grouped.get(group)
            if (!items?.length) return null
            return (
              <div key={group} className="mb-3">
                <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-2 mb-1">
                  {GROUP_LABELS[group]}
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

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {(selected || isNew) ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3">
              {isNew ? (
                <input
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setDirty(true) }}
                  placeholder="agent-name (kebab-case)"
                  className="bg-bg border border-border rounded px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className={clsx('text-xs px-2 py-0.5 rounded border', GROUP_COLORS[selected!.group])}>
                    {GROUP_LABELS[selected!.group]}
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
                  disabled={!dirty || (isNew && !newName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-bg rounded text-sm font-medium hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={14} />
                  Save
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <MarkdownEditor
                value={editContent}
                onChange={(v) => { setEditContent(v); setDirty(true) }}
                placeholder="Write the agent's system prompt in Markdown..."
                minHeight={400}
              />
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-text-secondary text-sm">
            Select an agent or create a new one
          </div>
        )}
      </div>
    </div>
  )
}
