import { FolderOpen, Plus, Hammer } from 'lucide-react'
import { useAppStore } from '../stores/app.store'

export function WelcomeView(): React.ReactElement {
  const { setProject } = useAppStore()

  const handleOpenProject = async (): Promise<void> => {
    const path = await window.forgeApi.app.openDirectory()
    if (path) {
      const { project, stats } = await window.forgeApi.project.open(path)
      setProject(project, stats)
    }
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-lg">
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Hammer size={40} className="text-accent" />
            <h1 className="text-4xl font-bold text-text-primary tracking-tight">
              Forge Studio
            </h1>
          </div>
          <p className="text-text-secondary text-lg">AI Development Cockpit</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleOpenProject}
            className="flex items-center gap-3 px-6 py-4 bg-surface border border-border rounded-lg hover:border-accent hover:bg-surface-hover transition-all group"
          >
            <FolderOpen size={24} className="text-text-secondary group-hover:text-accent transition-colors" />
            <div className="text-left">
              <div className="font-medium text-text-primary">Open Project</div>
              <div className="text-sm text-text-secondary">Open existing folder</div>
            </div>
          </button>

          <button className="flex items-center gap-3 px-6 py-4 bg-surface border border-border rounded-lg hover:border-accent hover:bg-surface-hover transition-all group opacity-50 cursor-not-allowed">
            <Plus size={24} className="text-text-secondary group-hover:text-accent transition-colors" />
            <div className="text-left">
              <div className="font-medium text-text-primary">New Project</div>
              <div className="text-sm text-text-secondary">Select tech stack</div>
            </div>
          </button>
        </div>

        {/* Recent projects placeholder */}
        <div className="mt-12 text-text-secondary text-sm">
          <p>Open a project folder with <code className="bg-surface px-1.5 py-0.5 rounded">CLAUDE.md</code> or <code className="bg-surface px-1.5 py-0.5 rounded">.claude/</code> to get started.</p>
        </div>
      </div>
    </div>
  )
}
