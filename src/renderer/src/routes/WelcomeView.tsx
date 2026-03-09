import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Plus, Hammer, Clock, X } from 'lucide-react'
import { useAppStore } from '../stores/app.store'
import { toast } from '../stores/toast.store'
import { NewProjectWizard } from '../components/wizard/NewProjectWizard'

export function WelcomeView(): React.ReactElement {
  const { setProject, recentProjects, setRecentProjects } = useAppStore()
  const { t } = useTranslation()
  const [wizardOpen, setWizardOpen] = useState(false)

  const handleOpenProject = async (): Promise<void> => {
    try {
      const path = await window.forgeApi.app.openDirectory()
      if (path) {
        const { project, stats } = await window.forgeApi.project.open(path)
        setProject(project, stats)
      }
    } catch (err) {
      toast.error(t('welcome.failedToOpen', { error: err instanceof Error ? err.message : String(err) }))
    }
  }

  const handleOpenRecent = async (path: string): Promise<void> => {
    try {
      const { project, stats } = await window.forgeApi.project.open(path)
      setProject(project, stats)
    } catch {
      toast.warning(t('welcome.projectRemovedWarning'))
      setRecentProjects(recentProjects.filter((p) => p.path !== path))
    }
  }

  const handleRemoveRecent = (path: string): void => {
    setRecentProjects(recentProjects.filter((p) => p.path !== path))
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-lg">
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Hammer size={40} className="text-accent" />
            <h1 className="text-4xl font-bold text-text-primary tracking-tight">
              {t('app.name')}
            </h1>
          </div>
          <p className="text-text-secondary text-lg">{t('app.tagline')}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleOpenProject}
            className="flex items-center gap-3 px-6 py-4 bg-surface border border-border rounded-lg hover:border-accent hover:bg-surface-hover transition-all group"
          >
            <FolderOpen size={24} className="text-text-secondary group-hover:text-accent transition-colors" />
            <div className="text-left">
              <div className="font-medium text-text-primary">{t('welcome.openProject')}</div>
              <div className="text-sm text-text-secondary">{t('welcome.openProjectHint')}</div>
            </div>
          </button>

          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-3 px-6 py-4 bg-surface border border-border rounded-lg hover:border-accent hover:bg-surface-hover transition-all group"
          >
            <Plus size={24} className="text-text-secondary group-hover:text-accent transition-colors" />
            <div className="text-left">
              <div className="font-medium text-text-primary">{t('welcome.newProject')}</div>
              <div className="text-sm text-text-secondary">{t('welcome.newProjectHint')}</div>
            </div>
          </button>
        </div>

        {/* Recent projects */}
        {recentProjects.length > 0 ? (
          <div className="mt-10 text-left">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <Clock size={14} className="text-text-secondary" />
              <span className="text-sm font-medium text-text-secondary">{t('welcome.recentProjects')}</span>
            </div>
            <div className="space-y-1">
              {recentProjects.slice(0, 5).map((rp) => (
                <button
                  key={rp.path}
                  onClick={() => handleOpenRecent(rp.path)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface-hover transition-colors group text-left"
                >
                  <FolderOpen size={16} className="text-text-secondary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">{rp.name}</div>
                    <div className="text-xs text-text-secondary truncate">{rp.path}</div>
                  </div>
                  <span
                    onClick={(e) => { e.stopPropagation(); handleRemoveRecent(rp.path) }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-error/10 text-text-secondary hover:text-error transition-all cursor-pointer"
                  >
                    <X size={12} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-12 text-text-secondary text-sm">
            <p>{t('welcome.instructions')}</p>
          </div>
        )}

        {/* Cmd+K hint */}
        <div className="mt-6 text-text-secondary text-xs">
          <kbd className="bg-surface px-1.5 py-0.5 rounded border border-border">{'\u2318'}K</kbd>
          <span className="ml-1.5">{t('common.commandPalette')}</span>
        </div>
      </div>

      {wizardOpen && (
        <NewProjectWizard
          onClose={() => setWizardOpen(false)}
          onComplete={async (path) => {
            setWizardOpen(false)
            try {
              const { project, stats } = await window.forgeApi.project.open(path)
              setProject(project, stats)
            } catch (err) {
              toast.error(t('welcome.failedToOpen', { error: err instanceof Error ? err.message : String(err) }))
            }
          }}
        />
      )}
    </div>
  )
}
