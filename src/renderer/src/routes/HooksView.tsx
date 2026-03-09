import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, Plus, Trash2, Wrench, Lightbulb } from 'lucide-react'
import { useAppStore } from '../stores/app.store'
import { toast } from '../stores/toast.store'
import { clsx } from 'clsx'
import type { SettingsConfig, HookMatcher } from '../../../shared/types/agent.types'

type HookType = 'SessionStart' | 'PreToolUse' | 'PostToolUse'
const HOOK_TYPES: HookType[] = ['SessionStart', 'PreToolUse', 'PostToolUse']

function HookEntryEditor({ hook, onChange, onDelete }: {
  hook: HookMatcher
  onChange: (hook: HookMatcher) => void
  onDelete: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  return (
    <div className="bg-bg border border-border rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-text-secondary w-16">{t('hooks.matcher')}</label>
        <input
          value={hook.matcher || ''}
          onChange={(e) => onChange({ ...hook, matcher: e.target.value || undefined })}
          placeholder={t('hooks.matcherPlaceholder')}
          className="flex-1 bg-surface border border-border rounded px-2 py-1 text-sm text-text-primary focus:outline-none focus:border-accent"
        />
        <button onClick={onDelete} className="p-1 rounded hover:bg-error/10 text-text-secondary hover:text-error">
          <Trash2 size={14} />
        </button>
      </div>
      {hook.hooks.map((entry, i) => (
        <div key={i} className="flex items-start gap-2 mb-1">
          <label className="text-xs text-text-secondary w-16 mt-1.5">{t('hooks.command')}</label>
          <textarea
            value={entry.command}
            onChange={(e) => {
              const newHooks = [...hook.hooks]
              newHooks[i] = { ...entry, command: e.target.value }
              onChange({ ...hook, hooks: newHooks })
            }}
            rows={2}
            className="flex-1 bg-surface border border-border rounded px-2 py-1 text-sm font-mono text-text-primary resize-none focus:outline-none focus:border-accent"
          />
          {hook.hooks.length > 1 && (
            <button
              onClick={() => {
                const newHooks = hook.hooks.filter((_, j) => j !== i)
                onChange({ ...hook, hooks: newHooks })
              }}
              className="p-1 mt-1 rounded hover:bg-error/10 text-text-secondary hover:text-error"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={() => onChange({ ...hook, hooks: [...hook.hooks, { type: 'command', command: '' }] })}
        className="text-xs text-accent hover:text-accent/80 mt-1"
      >
        {t('hooks.addCommand')}
      </button>
    </div>
  )
}

export function HooksView(): React.ReactElement {
  const { t } = useTranslation()
  const project = useAppStore((s) => s.project)
  const setDirtyView = useAppStore((s) => s.setDirtyView)
  const [settings, setSettings] = useState<SettingsConfig | null>(null)
  const [activeTab, setActiveTab] = useState<HookType>('PostToolUse')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!project) return
    window.forgeApi.settings.read(project.path).then(setSettings)
  }, [project?.path])

  useEffect(() => {
    setDirtyView(dirty)
  }, [dirty, setDirtyView])

  useEffect(() => {
    return () => setDirtyView(false)
  }, [setDirtyView])

  const handleSave = async (): Promise<void> => {
    if (!project || !settings) return
    setSaving(true)
    try {
      await window.forgeApi.settings.write(project.path, settings)
      setDirty(false)
      toast.success(t('hooks.saved'))
    } catch (err) {
      toast.error(t('hooks.saveFailed', { error: err instanceof Error ? err.message : String(err) }))
    } finally {
      setSaving(false)
    }
  }

  const getHooks = (type: HookType): HookMatcher[] => {
    return settings?.hooks?.[type] || []
  }

  const setHooks = (type: HookType, hooks: HookMatcher[]): void => {
    if (!settings) return
    setSettings({
      ...settings,
      hooks: { ...settings.hooks, [type]: hooks }
    })
    setDirty(true)
  }

  const addHook = (): void => {
    const current = getHooks(activeTab)
    setHooks(activeTab, [...current, { hooks: [{ type: 'command', command: '' }] }])
  }

  if (!settings) {
    return <div className="h-full flex items-center justify-center text-text-secondary">{t('hooks.loadingSettings')}</div>
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Wrench size={20} className="text-text-secondary" />
        <h2 className="text-lg font-semibold text-text-primary">{t('hooks.title')}</h2>
        <span className="text-sm text-text-secondary">{t('hooks.configFile')}</span>
        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-bg rounded text-sm font-medium hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={14} /> {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-4">
        {HOOK_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={clsx(
              'px-4 py-2.5 text-sm border-b-2 transition-colors',
              activeTab === type
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )}
          >
            {t(`hooks.types.${type}`)}
            {getHooks(type).length > 0 && (
              <span className="ml-1.5 text-xs bg-surface px-1.5 py-0.5 rounded">{getHooks(type).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Hook entries */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            {t(`hooks.descriptions.${activeTab}`)}
          </p>
          <button onClick={addHook} className="flex items-center gap-1 text-sm text-accent hover:text-accent/80">
            <Plus size={14} /> {t('hooks.addHook')}
          </button>
        </div>

        {getHooks(activeTab).length === 0 ? (
          <div className="text-center text-text-secondary text-sm py-8">
            <Wrench size={28} className="mx-auto mb-3 opacity-20" />
            <p>{t('hooks.emptyState', { type: activeTab })}</p>
            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-accent/80">
              <Lightbulb size={12} />
              <span>{t(`hooks.emptyStateHint.${activeTab}`)}</span>
            </div>
          </div>
        ) : (
          getHooks(activeTab).map((hook, idx) => (
            <HookEntryEditor
              key={idx}
              hook={hook}
              onChange={(updated) => {
                const hooks = [...getHooks(activeTab)]
                hooks[idx] = updated
                setHooks(activeTab, hooks)
              }}
              onDelete={() => {
                setHooks(activeTab, getHooks(activeTab).filter((_, i) => i !== idx))
              }}
            />
          ))
        )}

        {/* Permissions section */}
        {settings.permissions && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">{t('hooks.permissions')}</h3>
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="mb-3">
                <label className="text-xs text-text-secondary block mb-1">{t('hooks.allowedTools')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {(settings.permissions.allowedTools || []).map((tool, i) => (
                    <span key={i} className="text-xs bg-success/10 text-success px-2 py-0.5 rounded border border-success/20">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">{t('hooks.denied')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {(settings.permissions.deny || []).map((tool, i) => (
                    <span key={i} className="text-xs bg-error/10 text-error px-2 py-0.5 rounded border border-error/20">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
