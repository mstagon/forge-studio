import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, Zap, Plug, GitBranch, FileText, ArrowRight, Download, Upload } from 'lucide-react'
import { useAppStore } from '../stores/app.store'
import { toast } from '../stores/toast.store'

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
  const { t } = useTranslation()
  const { project, projectStats, setView, refreshStats } = useAppStore()
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    refreshStats()
  }, [project?.path])

  const handleExportPreset = async (): Promise<void> => {
    if (!project) return
    setExporting(true)
    try {
      const preset = await window.forgeApi.presets.export(project.path, {
        name: project.name,
        description: `Preset exported from ${project.name}`,
        icon: '📦',
        category: 'custom'
      })
      const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name}-preset.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t('dashboard.presetExported'))
    } catch (err) {
      toast.error(t('dashboard.exportFailed', { error: err instanceof Error ? err.message : String(err) }))
    } finally {
      setExporting(false)
    }
  }

  const handleImportPreset = (): void => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e): Promise<void> => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        await window.forgeApi.presets.import(text)
        toast.success(t('dashboard.presetImported'))
      } catch (err) {
        toast.error(t('dashboard.importFailed', { error: err instanceof Error ? err.message : String(err) }))
      }
    }
    input.click()
  }

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
        <StatCard icon={Bot} label={t('dashboard.agents')} value={projectStats?.agentCount || 0} color="text-agent-plan" />
        <StatCard icon={Zap} label={t('dashboard.commands')} value={projectStats?.commandCount || 0} color="text-accent" />
        <StatCard icon={Plug} label={t('dashboard.mcpServers')} value={projectStats?.mcpServerCount || 0} color="text-success" />
      </div>

      {/* Project info */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Git info */}
        {projectStats?.branch && (
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
              <GitBranch size={14} />
              <span>{t('dashboard.git')}</span>
            </div>
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-text-secondary">{t('dashboard.branch')}</span>
                <span className="text-text-primary font-mono">{projectStats.branch}</span>
              </div>
              {projectStats.lastCommit && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">{t('dashboard.lastCommit')}</span>
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
            <span>{t('dashboard.configuration')}</span>
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-text-secondary">CLAUDE.md</span>
              <span className={project.hasClaudeMd ? 'text-success' : 'text-error'}>
                {project.hasClaudeMd ? t('common.found') : t('common.missing')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">.claude/</span>
              <span className={project.hasClaudeDir ? 'text-success' : 'text-error'}>
                {project.hasClaudeDir ? t('common.found') : t('common.missing')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">{t('dashboard.skills')}</span>
              <span className="text-text-primary">{projectStats?.skillCount || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-3 gap-3">
          <QuickAction icon={FileText} label={t('dashboard.planFeature')} onClick={() => setView('planning')} />
          <QuickAction icon={Bot} label={t('dashboard.manageAgents')} onClick={() => setView('agents')} />
          <QuickAction icon={Zap} label={t('dashboard.editCommands')} onClick={() => setView('commands')} />
          <QuickAction icon={Plug} label={t('dashboard.mcpServersAction')} onClick={() => setView('mcp')} />
          <QuickAction icon={GitBranch} label={t('dashboard.workflowAction')} onClick={() => setView('workflow')} />
          <QuickAction
            icon={FileText}
            label={t('dashboard.editClaudeMd')}
            onClick={() => setView('claude-md')}
          />
          <QuickAction icon={Download} label={exporting ? t('dashboard.exporting') : t('dashboard.exportPreset')} onClick={handleExportPreset} disabled={exporting} />
          <QuickAction icon={Upload} label={t('dashboard.importPreset')} onClick={handleImportPreset} />
        </div>
      </div>
    </div>
  )
}
