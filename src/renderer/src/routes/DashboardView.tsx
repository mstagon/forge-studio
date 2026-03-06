import { Bot, Zap, Plug, GitBranch, FileText, ArrowRight } from 'lucide-react'
import { useAppStore } from '../stores/app.store'

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
}): React.ReactElement {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg bg-opacity-10 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold text-text-primary">{value}</div>
        <div className="text-sm text-text-secondary">{label}</div>
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, onClick, disabled }: {
  icon: React.ElementType
  label: string
  onClick?: () => void
  disabled?: boolean
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-lg hover:border-accent hover:bg-surface-hover transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed group"
    >
      <Icon size={16} className="text-text-secondary group-hover:text-accent" />
      <span className="text-text-primary">{label}</span>
      <ArrowRight size={14} className="ml-auto text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}

export function DashboardView(): React.ReactElement {
  const { project, projectStats, setView } = useAppStore()

  if (!project) return <div />

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{project.name}</h1>
        <p className="text-text-secondary text-sm mt-1">{project.path}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={Bot} label="Agents" value={projectStats?.agentCount || 0} color="text-agent-plan" />
        <StatCard icon={Zap} label="Commands" value={projectStats?.commandCount || 0} color="text-accent" />
        <StatCard icon={Plug} label="MCP Servers" value={projectStats?.hasMcpServers ? 'Active' : '0'} color="text-success" />
      </div>

      {/* Project info */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Git info */}
        {projectStats?.branch && (
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
              <GitBranch size={14} />
              <span>Git</span>
            </div>
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-text-secondary">Branch</span>
                <span className="text-text-primary font-mono">{projectStats.branch}</span>
              </div>
              {projectStats.lastCommit && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Last commit</span>
                  <span className="text-text-primary font-mono text-xs">{projectStats.lastCommit}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Config status */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
            <FileText size={14} />
            <span>Configuration</span>
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-text-secondary">CLAUDE.md</span>
              <span className={project.hasClaudeMd ? 'text-success' : 'text-error'}>
                {project.hasClaudeMd ? 'Found' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">.claude/</span>
              <span className={project.hasClaudeDir ? 'text-success' : 'text-error'}>
                {project.hasClaudeDir ? 'Found' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Skills</span>
              <span className="text-text-primary">{projectStats?.skillCount || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <QuickAction icon={FileText} label="Plan Feature" onClick={() => setView('planning')} />
          <QuickAction icon={Bot} label="Manage Agents" onClick={() => setView('agents')} />
          <QuickAction icon={Zap} label="Edit Commands" onClick={() => setView('commands')} />
          <QuickAction icon={Plug} label="MCP Servers" onClick={() => setView('mcp')} />
          <QuickAction icon={GitBranch} label="Workflow" onClick={() => setView('workflow')} />
          <QuickAction
            icon={FileText}
            label="Edit CLAUDE.md"
            onClick={() => setView('claude-md')}
          />
        </div>
      </div>
    </div>
  )
}
