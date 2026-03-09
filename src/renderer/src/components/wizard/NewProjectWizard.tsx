import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderOpen, ChevronRight, ChevronLeft, Check, Loader2, X } from 'lucide-react'
import { clsx } from 'clsx'
import type { TechStackPreset } from '../../../../shared/types/preset.types'

interface Props {
  onClose: () => void
  onComplete: (projectPath: string) => void
}

type Step = 'location' | 'preset' | 'confirm'

export function NewProjectWizard({ onClose, onComplete }: Props): React.ReactElement {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('location')
  const [projectPath, setProjectPath] = useState('')
  const [projectName, setProjectName] = useState('')
  const [presets, setPresets] = useState<TechStackPreset[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.forgeApi.presets.list().then(setPresets).catch(() => {})
  }, [])

  const handleSelectFolder = async (): Promise<void> => {
    const path = await window.forgeApi.app.openDirectory()
    if (path) {
      setProjectPath(path)
      const parts = path.split('/')
      setProjectName(parts[parts.length - 1] || '')
    }
  }

  const handleApply = async (): Promise<void> => {
    if (!projectPath || !selectedPreset) return
    setApplying(true)
    setError(null)
    try {
      await window.forgeApi.presets.apply(projectPath, selectedPreset)
      onComplete(projectPath)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply preset')
    } finally {
      setApplying(false)
    }
  }

  const currentPreset = presets.find((p) => p.id === selectedPreset)

  const canNext = step === 'location' ? !!projectPath : step === 'preset' ? !!selectedPreset : true

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-bg border border-border rounded-xl w-[680px] max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">{t('wizard.title')}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border">
          {(['location', 'preset', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                  step === s
                    ? 'bg-accent text-bg'
                    : (['location', 'preset', 'confirm'].indexOf(step) > i)
                      ? 'bg-success text-bg'
                      : 'bg-surface text-text-secondary border border-border'
                )}
              >
                {(['location', 'preset', 'confirm'].indexOf(step) > i) ? <Check size={12} /> : i + 1}
              </div>
              <span className={clsx('text-sm', step === s ? 'text-text-primary' : 'text-text-secondary')}>
                {t(`wizard.steps.${s}`)}
              </span>
              {i < 2 && <ChevronRight size={14} className="text-text-secondary/30 mx-1" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'location' && (
            <div>
              <p className="text-sm text-text-secondary mb-4">
                {t('wizard.locationDescription')}
              </p>
              <button
                onClick={handleSelectFolder}
                className="flex items-center gap-3 w-full px-4 py-3 bg-surface border border-border rounded-lg hover:border-accent transition-colors text-left"
              >
                <FolderOpen size={20} className="text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  {projectPath ? (
                    <>
                      <div className="text-sm font-medium text-text-primary truncate">{projectName}</div>
                      <div className="text-xs text-text-secondary truncate">{projectPath}</div>
                    </>
                  ) : (
                    <div className="text-sm text-text-secondary">{t('wizard.locationPlaceholder')}</div>
                  )}
                </div>
              </button>
            </div>
          )}

          {step === 'preset' && (
            <div>
              <p className="text-sm text-text-secondary mb-4">
                {t('wizard.presetDescription')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={clsx(
                      'text-left p-4 rounded-lg border transition-all',
                      selectedPreset === preset.id
                        ? 'bg-accent/10 border-accent'
                        : 'bg-surface border-border hover:border-text-secondary/30'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{preset.icon}</span>
                      <span className="font-medium text-text-primary text-sm">{preset.name}</span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2">{preset.description}</p>
                    {preset.stack.language && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-[10px] bg-bg px-1.5 py-0.5 rounded text-text-secondary">{preset.stack.language}</span>
                        <span className="text-[10px] bg-bg px-1.5 py-0.5 rounded text-text-secondary">{preset.stack.framework}</span>
                        {preset.stack.backend && (
                          <span className="text-[10px] bg-bg px-1.5 py-0.5 rounded text-text-secondary">{preset.stack.backend}</span>
                        )}
                      </div>
                    )}
                    <div className="text-[10px] text-text-secondary/60 mt-2">
                      {preset.agents.length} agents / {preset.commands.length} commands
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'confirm' && currentPreset && (
            <div>
              <p className="text-sm text-text-secondary mb-4">
                {t('wizard.confirmDescription')}
              </p>

              <div className="bg-surface border border-border rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{currentPreset.icon}</span>
                  <span className="font-semibold text-text-primary">{currentPreset.name}</span>
                </div>
                <div className="text-xs text-text-secondary mb-3">
                  <span className="font-medium text-text-secondary/80">{t('wizard.locationLabel')}</span> {projectPath}
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-medium text-text-secondary/80">{t('wizard.willCreate')}</span>
                    <ul className="mt-1 space-y-0.5 text-text-secondary">
                      <li>{t('wizard.claudemdRules')}</li>
                      <li>{t('wizard.agentsCount', { count: currentPreset.agents.length })}</li>
                      <li>{t('wizard.commandsCount', { count: currentPreset.commands.length })}</li>
                      {currentPreset.skills.length > 0 && (
                        <li>{t('wizard.skillsCount', { count: currentPreset.skills.length })}</li>
                      )}
                      <li>{t('wizard.settingsFile')}</li>
                      <li>{t('wizard.templatesDir')}</li>
                    </ul>
                  </div>

                  {currentPreset.agents.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <span className="font-medium text-text-secondary/80">{t('wizard.agentsLabel')}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {currentPreset.agents.map((a) => (
                          <span key={a.fileName} className="bg-bg px-1.5 py-0.5 rounded text-text-secondary">
                            {a.fileName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentPreset.recommendedMcp.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <span className="font-medium text-text-secondary/80">{t('wizard.recommendedMcp')}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {currentPreset.recommendedMcp.map((m) => (
                          <span key={m.name} className="bg-bg px-1.5 py-0.5 rounded text-text-secondary">
                            {m.name}{m.required && ' *'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-error/10 border border-error/30 rounded-lg p-3 mb-4 text-sm text-error">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button
            onClick={() => {
              if (step === 'preset') setStep('location')
              else if (step === 'confirm') setStep('preset')
              else onClose()
            }}
            className="flex items-center gap-1 px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={14} />
            {step === 'location' ? t('common.cancel') : t('common.back')}
          </button>

          {step === 'confirm' ? (
            <button
              onClick={handleApply}
              disabled={applying}
              className="flex items-center gap-2 px-5 py-2 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {applying ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {applying ? t('wizard.applying') : t('wizard.applyOpen')}
            </button>
          ) : (
            <button
              onClick={() => {
                if (step === 'location') setStep('preset')
                else if (step === 'preset') setStep('confirm')
              }}
              disabled={!canNext}
              className="flex items-center gap-1 px-5 py-2 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {t('common.next')} <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
