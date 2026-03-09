import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, Eye, Code, Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '../stores/app.store'
import { toast } from '../stores/toast.store'
import { MarkdownEditor } from '../components/common/MarkdownEditor'
import { clsx } from 'clsx'
import type { ClaudeMdConfig, ClaudeMdSection } from '../../../shared/types/claude-md.types'

export function ClaudeMdView(): React.ReactElement {
  const { t } = useTranslation()
  const project = useAppStore((s) => s.project)
  const setDirtyView = useAppStore((s) => s.setDirtyView)
  const [config, setConfig] = useState<ClaudeMdConfig | null>(null)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const [mode, setMode] = useState<'visual' | 'raw'>('visual')
  const [rawContent, setRawContent] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!project) return
    window.forgeApi.claudeMd.read(project.path).then((data: ClaudeMdConfig | null) => {
      if (data) {
        setConfig(data)
        setRawContent(data.raw)
        if (data.sections.length > 0) setSelectedIdx(0)
      }
    })
  }, [project?.path])

  // Sync dirty state with global dirtyView
  useEffect(() => {
    setDirtyView(dirty)
  }, [dirty, setDirtyView])

  // Clean up dirtyView on unmount
  useEffect(() => {
    return () => setDirtyView(false)
  }, [setDirtyView])

  const handleSave = async (): Promise<void> => {
    if (!project || !config) return
    setSaving(true)
    try {
      if (mode === 'raw') {
        await window.forgeApi.fs.writeFile(`${project.path}/CLAUDE.md`, rawContent)
        // Re-parse
        const data = await window.forgeApi.claudeMd.read(project.path)
        if (data) {
          setConfig(data)
          setRawContent(data.raw)
        }
      } else {
        await window.forgeApi.claudeMd.write(project.path, config)
        // Re-read to get the freshly serialized raw content
        const freshData = await window.forgeApi.claudeMd.read(project.path)
        if (freshData) {
          setConfig(freshData)
          setRawContent(freshData.raw)
        }
      }
      setDirty(false)
      toast.success(t('claudemd.saved'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('claudemd.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const updateSection = (idx: number, newContent: string): void => {
    if (!config) return
    const sections = [...config.sections]
    sections[idx] = { ...sections[idx], content: newContent }
    setConfig({ ...config, sections })
    setDirty(true)
  }

  const updateSectionHeading = (idx: number, heading: string): void => {
    if (!config) return
    const sections = [...config.sections]
    sections[idx] = { ...sections[idx], heading }
    setConfig({ ...config, sections })
    setDirty(true)
  }

  const addSection = (): void => {
    if (!config) return
    const newSection: ClaudeMdSection = { heading: t('claudemd.newSection'), level: 2, content: '', raw: '' }
    setConfig({ ...config, sections: [...config.sections, newSection] })
    setSelectedIdx(config.sections.length)
    setDirty(true)
  }

  const deleteSection = (idx: number): void => {
    if (!config) return
    const sections = config.sections.filter((_, i) => i !== idx)
    setConfig({ ...config, sections })
    if (selectedIdx >= sections.length) setSelectedIdx(Math.max(0, sections.length - 1))
    setDirty(true)
  }

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center text-text-secondary">
        {project?.hasClaudeMd ? t('claudemd.loadingFile') : t('claudemd.notFound')}
      </div>
    )
  }

  const currentSection = config.sections[selectedIdx]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <h2 className="text-lg font-semibold text-text-primary">{t('claudemd.title')}</h2>
        <span className="text-sm text-text-secondary">— {config.title}</span>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex bg-surface border border-border rounded overflow-hidden">
            <button
              onClick={() => setMode('visual')}
              className={clsx('px-3 py-1 text-xs flex items-center gap-1', mode === 'visual' ? 'bg-accent text-bg' : 'text-text-secondary hover:text-text-primary')}
            >
              <Eye size={12} /> {t('claudemd.visual')}
            </button>
            <button
              onClick={async () => {
                if (config && dirty && project) {
                  // Re-serialize sections to raw before switching to raw mode
                  const freshRaw = await window.forgeApi.claudeMd.read(project.path)
                  // Build raw from current sections
                  const lines: string[] = []
                  if (config.title) lines.push(`# ${config.title}`, '')
                  for (const s of config.sections) {
                    lines.push(`${'#'.repeat(s.level)} ${s.heading}`, '', s.content, '')
                  }
                  setRawContent(lines.join('\n'))
                } else {
                  setRawContent(config?.raw ?? '')
                }
                setMode('raw')
              }}
              className={clsx('px-3 py-1 text-xs flex items-center gap-1', mode === 'raw' ? 'bg-accent text-bg' : 'text-text-secondary hover:text-text-primary')}
            >
              <Code size={12} /> {t('claudemd.raw')}
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-bg rounded text-sm font-medium hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={14} /> {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>

      {mode === 'raw' ? (
        <div className="flex-1 overflow-y-auto p-4">
          <MarkdownEditor
            value={rawContent}
            onChange={(v) => { setRawContent(v); setDirty(true) }}
            minHeight={600}
          />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Section list */}
          <div className="w-[220px] border-r border-border flex flex-col">
            <div className="p-2 border-b border-border flex items-center justify-between">
              <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider px-1">{t('claudemd.sections')}</span>
              <button onClick={addSection} className="p-1 rounded hover:bg-surface-hover text-text-secondary hover:text-accent">
                <Plus size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {config.sections.map((section, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={clsx(
                    'w-full text-left px-2 py-1.5 rounded text-sm transition-colors',
                    selectedIdx === idx
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  )}
                >
                  <span className="text-xs text-text-secondary mr-1">{'#'.repeat(section.level)}</span>
                  <span className="truncate">{section.heading}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section editor */}
          <div className="flex-1 overflow-y-auto p-4">
            {currentSection ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-text-secondary text-sm">{'#'.repeat(currentSection.level)}</span>
                  <input
                    value={currentSection.heading}
                    onChange={(e) => updateSectionHeading(selectedIdx, e.target.value)}
                    className="flex-1 bg-bg border border-border rounded px-3 py-1.5 text-lg font-semibold text-text-primary focus:outline-none focus:border-accent"
                  />
                  <button
                    onClick={() => deleteSection(selectedIdx)}
                    className="p-2 rounded hover:bg-error/10 text-text-secondary hover:text-error transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <MarkdownEditor
                  value={currentSection.content}
                  onChange={(v) => updateSection(selectedIdx, v)}
                  minHeight={300}
                />
              </div>
            ) : (
              <div className="text-text-secondary text-sm">{t('claudemd.selectSection')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
