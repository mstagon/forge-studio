import { useAppStore } from '../../stores/app.store'
import { Circle, GitBranch } from 'lucide-react'

export function StatusBar(): React.ReactElement {
  const { project, projectStats, claudeInstalled, claudeVersion } = useAppStore()

  return (
    <div className="h-[26px] bg-surface border-t border-border flex items-center px-3 text-xs text-text-secondary gap-4">
      {/* Claude CLI status */}
      <div className="flex items-center gap-1.5">
        <Circle
          size={8}
          className={claudeInstalled ? 'fill-success text-success' : 'fill-error text-error'}
        />
        <span>
          {claudeInstalled ? `Claude CLI ${claudeVersion || ''}` : 'Claude CLI not found'}
        </span>
      </div>

      {project && (
        <>
          <div className="h-3 w-px bg-border" />

          {/* Project */}
          <span className="text-text-primary font-medium">{project.name}</span>

          {/* Git branch */}
          {projectStats?.branch && (
            <>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1">
                <GitBranch size={12} />
                <span>{projectStats.branch}</span>
              </div>
            </>
          )}

          {/* Stats */}
          <div className="ml-auto flex items-center gap-3">
            <span>{projectStats?.agentCount || 0} agents</span>
            <span>{projectStats?.commandCount || 0} commands</span>
            <span>{projectStats?.skillCount || 0} skills</span>
          </div>
        </>
      )}
    </div>
  )
}
