import { useAppStore } from '../../stores/app.store'
import { useTranslation } from 'react-i18next'
import { changeLanguage, getCurrentLanguage } from '../../i18n'
import { Circle, GitBranch, Sun, Moon, Command, Globe } from 'lucide-react'

export function StatusBar(): React.ReactElement {
  const { project, projectStats, claudeInstalled, claudeVersion, theme, toggleTheme, setCommandPaletteOpen } = useAppStore()
  const { t } = useTranslation()
  const lang = getCurrentLanguage()

  const handleToggleLanguage = (): void => {
    changeLanguage(lang === 'ko' ? 'en' : 'ko')
  }

  return (
    <div className="h-[26px] bg-surface border-t border-border flex items-center px-3 text-xs text-text-secondary gap-4">
      {/* Claude CLI status */}
      <div className="flex items-center gap-1.5">
        <Circle
          size={8}
          className={claudeInstalled ? 'fill-success text-success' : 'fill-error text-error'}
        />
        <span>
          {claudeInstalled
            ? t('statusBar.claudeInstalled', { version: claudeVersion || '' })
            : t('statusBar.claudeNotFound')}
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
            <span>{projectStats?.agentCount || 0} {t('nav.agents').toLowerCase()}</span>
            <span>{projectStats?.commandCount || 0} {t('nav.commands').toLowerCase()}</span>
            <span>{projectStats?.skillCount || 0} {t('nav.skills').toLowerCase()}</span>
          </div>
        </>
      )}

      {/* Right side actions */}
      <div className={project ? '' : 'ml-auto'}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-1 hover:text-text-primary transition-colors"
            title={`${t('common.commandPalette')} (Cmd+K)`}
          >
            <Command size={11} />
            <span>K</span>
          </button>
          <div className="h-3 w-px bg-border" />
          <button
            onClick={handleToggleLanguage}
            className="flex items-center gap-1 hover:text-text-primary transition-colors"
            title={lang === 'ko' ? 'English' : '한국어'}
          >
            <Globe size={12} />
            <span className="uppercase">{lang}</span>
          </button>
          <div className="h-3 w-px bg-border" />
          <button
            onClick={toggleTheme}
            className="hover:text-text-primary transition-colors"
            title={theme === 'dark' ? t('statusBar.switchLight') : t('statusBar.switchDark')}
          >
            {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
          </button>
        </div>
      </div>
    </div>
  )
}
