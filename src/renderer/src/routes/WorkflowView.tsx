import { Play, Square, CheckCircle2, Circle, Loader2, SkipForward, ThumbsUp, XCircle, Clock, Plus, Trash2, GripVertical, ArrowUp, ArrowDown, Settings2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../stores/app.store'
import { toast } from '../stores/toast.store'
import { clsx } from 'clsx'

interface WorkflowStepDef {
  id: string
  name: string
  command: string
  type: 'auto' | 'gate'
}

interface WorkflowStepStatus extends WorkflowStepDef {
  status: 'pending' | 'running' | 'done' | 'failed' | 'skipped' | 'waiting'
  output: string
}

interface WorkflowRunState {
  id: string
  steps: WorkflowStepStatus[]
  currentStep: number
  status: 'idle' | 'running' | 'paused' | 'done' | 'failed'
}

const DEFAULT_STEPS: WorkflowStepDef[] = [
  { id: '1', name: 'Plan Feature', command: 'Write a PRD for the feature: {feature}', type: 'auto' },
  { id: '2', name: 'Generate Spec', command: 'Create a technical spec from the PRD in docs/prd/', type: 'auto' },
  { id: '3', name: 'Review Plan', command: '', type: 'gate' },
  { id: '4', name: 'Implement', command: 'Implement the feature based on the spec in docs/specs/', type: 'auto' },
  { id: '5', name: 'Code Review', command: 'Review the implementation for bugs, security issues, and code quality', type: 'auto' },
  { id: '6', name: 'Approval', command: '', type: 'gate' },
  { id: '7', name: 'Document', command: 'Update documentation for the implemented feature', type: 'auto' }
]

let nextStepId = 100

function StepIcon({ status }: { status: WorkflowStepStatus['status'] }): React.ReactElement {
  switch (status) {
    case 'done':
      return <CheckCircle2 size={18} className="text-success" />
    case 'running':
      return <Loader2 size={18} className="text-accent animate-spin" />
    case 'failed':
      return <XCircle size={18} className="text-error" />
    case 'waiting':
      return <Clock size={18} className="text-warning" />
    case 'skipped':
      return <SkipForward size={18} className="text-text-secondary/50" />
    default:
      return <Circle size={18} className="text-text-secondary/30" />
  }
}

export function WorkflowView(): React.ReactElement {
  const { t } = useTranslation()
  const project = useAppStore((s) => s.project)
  const claudeInstalled = useAppStore((s) => s.claudeInstalled)
  const [featureName, setFeatureName] = useState('')
  const [runState, setRunState] = useState<WorkflowRunState | null>(null)
  const [selectedStepOutput, setSelectedStepOutput] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [customSteps, setCustomSteps] = useState<WorkflowStepDef[]>(DEFAULT_STEPS)
  const [editingStep, setEditingStep] = useState<string | null>(null)
  const outputRef = useRef<HTMLPreElement>(null)

  // Listen for workflow state changes
  useEffect(() => {
    const unsub = window.forgeApi.workflow.onState((state) => {
      setRunState(state as WorkflowRunState)
    })
    // Check for existing state on mount
    window.forgeApi.workflow.getState().then((state) => {
      if (state) setRunState(state as WorkflowRunState)
    })
    return unsub
  }, [])

  // Listen for output
  useEffect(() => {
    const unsub = window.forgeApi.workflow.onOutput((_wfId, stepId, _data) => {
      setRunState((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          steps: prev.steps.map((s) =>
            s.id === stepId ? { ...s, output: s.output + _data } : s
          )
        }
      })
    })
    return unsub
  }, [])

  // Notify on workflow completion/failure (only on transition, not on mount)
  const prevStatusRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const status = runState?.status
    if (prevStatusRef.current && prevStatusRef.current !== status) {
      if (status === 'done') toast.success(t('workflow.completed'))
      if (status === 'failed') toast.error(t('workflow.failed'))
    }
    prevStatusRef.current = status
  }, [runState?.status])

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [runState, selectedStepOutput])

  const handleStart = async (): Promise<void> => {
    if (!project) return
    if (!featureName.trim()) {
      toast.warning(t('workflow.featureNameRequired'))
      return
    }
    if (!claudeInstalled) {
      toast.error(t('workflow.claudeNotInstalled'))
      return
    }
    try {
      const steps = customSteps.map((s) => ({
        ...s,
        command: s.command.replace('{feature}', featureName)
      }))
      const state = await window.forgeApi.workflow.start(project.path, steps) as WorkflowRunState
      setRunState(state)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('workflow.startFailed'))
    }
  }

  const addStep = (type: 'auto' | 'gate'): void => {
    const id = String(++nextStepId)
    setCustomSteps([...customSteps, {
      id,
      name: type === 'gate' ? t('workflow.approvalGate') : t('workflow.newStep'),
      command: type === 'gate' ? '' : t('workflow.stepCommandPlaceholder'),
      type
    }])
    if (type === 'auto') setEditingStep(id)
  }

  const removeStep = (id: string): void => {
    setCustomSteps(customSteps.filter((s) => s.id !== id))
  }

  const moveStep = (id: string, dir: -1 | 1): void => {
    const idx = customSteps.findIndex((s) => s.id === id)
    if (idx < 0) return
    const target = idx + dir
    if (target < 0 || target >= customSteps.length) return
    const next = [...customSteps]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setCustomSteps(next)
  }

  const updateStep = (id: string, updates: Partial<WorkflowStepDef>): void => {
    setCustomSteps(customSteps.map((s) => s.id === id ? { ...s, ...updates } : s))
  }

  const handleStop = async (): Promise<void> => {
    await window.forgeApi.workflow.stop()
  }

  const handleApprove = async (): Promise<void> => {
    if (!project) return
    await window.forgeApi.workflow.approve(project.path)
  }

  const handleSkip = async (): Promise<void> => {
    if (!project) return
    await window.forgeApi.workflow.skip(project.path)
  }

  const isRunning = runState?.status === 'running' || runState?.status === 'paused'
  const steps = runState?.steps ?? customSteps.map((s) => ({ ...s, status: 'pending' as const, output: '' }))
  const viewingStep = selectedStepOutput ? steps.find((s) => s.id === selectedStepOutput) : null

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <h2 className="text-lg font-semibold text-text-primary">{t('workflow.title')}</h2>
        <span className="text-sm text-text-secondary">{t('workflow.subtitle')}</span>
        {!isRunning && (
          <button
            onClick={() => setEditMode(!editMode)}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors',
              editMode ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            )}
          >
            <Settings2 size={13} />
            {editMode ? t('common.done') : t('workflow.editPipeline')}
          </button>
        )}
        {runState?.status && runState.status !== 'idle' && (
          <span className={clsx(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            runState.status === 'running' && 'bg-accent/10 text-accent',
            runState.status === 'paused' && 'bg-warning/10 text-warning',
            runState.status === 'done' && 'bg-success/10 text-success',
            runState.status === 'failed' && 'bg-error/10 text-error'
          )}>
            {t('workflow.status.' + runState.status)}
          </span>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: pipeline */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Feature input */}
          <div className="mb-6 max-w-lg">
            <label className="text-sm text-text-secondary block mb-2">{t('planning.featureName')}</label>
            <div className="flex gap-2">
              <input
                value={featureName}
                onChange={(e) => setFeatureName(e.target.value)}
                placeholder={t('workflow.featureNamePlaceholder', 'e.g., product-upload')}
                disabled={isRunning}
                className="flex-1 bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
              />
              {isRunning ? (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-4 py-2.5 bg-error text-white rounded-lg text-sm font-medium hover:bg-error/90 transition-colors"
                >
                  <Square size={14} /> {t('common.stop')}
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={!featureName || !project}
                  className="flex items-center gap-2 px-4 py-2.5 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Play size={14} /> {t('common.run')}
                </button>
              )}
            </div>
          </div>

          {/* Gate approval buttons */}
          {runState?.status === 'paused' && (
            <div className="mb-6 max-w-lg bg-warning/5 border border-warning/20 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-primary">
                  {t('workflow.waitingApproval', { step: steps[runState.currentStep]?.name })}
                </div>
                <div className="text-xs text-text-secondary mt-0.5">
                  {t('workflow.approvalInstructions')}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSkip}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary border border-border rounded transition-colors"
                >
                  <SkipForward size={12} /> {t('common.skip')}
                </button>
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-success text-white rounded font-medium hover:bg-success/90 transition-colors"
                >
                  <ThumbsUp size={12} /> {t('common.approve')}
                </button>
              </div>
            </div>
          )}

          {/* Pipeline */}
          <div className="max-w-2xl">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">{t('workflow.pipelineSteps')}</h3>

            {editMode ? (
              /* Edit mode */
              <div className="space-y-2">
                {customSteps.map((step, idx) => (
                  <div key={step.id} className="bg-surface border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <GripVertical size={14} className="text-text-secondary/30" />
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveStep(step.id, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-bg text-text-secondary disabled:opacity-20 transition-colors"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={() => moveStep(step.id, 1)}
                          disabled={idx === customSteps.length - 1}
                          className="p-1 rounded hover:bg-bg text-text-secondary disabled:opacity-20 transition-colors"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>

                      {editingStep === step.id ? (
                        <input
                          value={step.name}
                          onChange={(e) => updateStep(step.id, { name: e.target.value })}
                          onBlur={() => setEditingStep(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingStep(null)}
                          autoFocus
                          className="flex-1 bg-bg border border-accent rounded px-2 py-1 text-sm text-text-primary focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingStep(step.id)}
                          className="flex-1 text-left text-sm font-medium text-text-primary hover:text-accent transition-colors"
                        >
                          {step.name}
                        </button>
                      )}

                      <select
                        value={step.type}
                        onChange={(e) => updateStep(step.id, { type: e.target.value as 'auto' | 'gate' })}
                        className="bg-bg border border-border rounded px-2 py-1 text-xs text-text-secondary focus:outline-none"
                      >
                        <option value="auto">auto</option>
                        <option value="gate">gate</option>
                      </select>

                      <button
                        onClick={() => removeStep(step.id)}
                        className="p-1 rounded hover:bg-error/10 text-text-secondary hover:text-error transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {step.type === 'auto' && (
                      <textarea
                        value={step.command}
                        onChange={(e) => updateStep(step.id, { command: e.target.value })}
                        placeholder={t('workflow.promptPlaceholder')}
                        rows={2}
                        className="w-full bg-bg border border-border rounded px-3 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-accent resize-none"
                      />
                    )}
                  </div>
                ))}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => addStep('auto')}
                    className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-border rounded-lg text-xs text-text-secondary hover:text-accent hover:border-accent transition-colors"
                  >
                    <Plus size={13} /> {t('workflow.addStep')}
                  </button>
                  <button
                    onClick={() => addStep('gate')}
                    className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-warning/30 rounded-lg text-xs text-text-secondary hover:text-warning hover:border-warning transition-colors"
                  >
                    <Plus size={13} /> {t('workflow.addGate')}
                  </button>
                </div>
              </div>
            ) : (
              /* Run mode */
              <div className="space-y-1">
                {steps.map((step, idx) => (
                  <div key={step.id}>
                    <button
                      onClick={() => setSelectedStepOutput(step.id === selectedStepOutput ? null : step.id)}
                      className={clsx(
                        'w-full flex items-center gap-4 px-4 py-3 rounded-lg border transition-colors text-left',
                        step.status === 'running' ? 'bg-accent/5 border-accent/30' :
                        step.status === 'done' ? 'bg-success/5 border-success/20' :
                        step.status === 'failed' ? 'bg-error/5 border-error/20' :
                        step.status === 'waiting' ? 'bg-warning/5 border-warning/20' :
                        selectedStepOutput === step.id ? 'bg-surface border-accent/30' :
                        'bg-surface border-border hover:border-text-secondary/30'
                      )}
                    >
                      <StepIcon status={step.status} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary">{step.name}</div>
                        <div className="text-xs text-text-secondary font-mono truncate">
                          {step.type === 'gate' ? t('workflow.manualApproval') : step.command}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {step.type === 'gate' && (
                          <span className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded">{t('workflow.gate')}</span>
                        )}
                        <span className="text-xs text-text-secondary">{t('workflow.step', { number: idx + 1 })}</span>
                      </div>
                    </button>
                    {idx < steps.length - 1 && (
                      <div className="flex justify-center py-1">
                        <div className="w-px h-4 bg-border" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: output panel */}
        {viewingStep && viewingStep.output && (
          <div className="w-[400px] border-l border-border flex flex-col bg-[#0d1117]">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">{t('workflow.outputTitle', { step: viewingStep.name })}</span>
              <button
                onClick={() => setSelectedStepOutput(null)}
                className="text-xs text-text-secondary hover:text-text-primary"
              >
                {t('common.close')}
              </button>
            </div>
            <pre
              ref={outputRef}
              className="flex-1 overflow-auto p-4 text-xs text-green-400 font-mono whitespace-pre-wrap"
            >
              {viewingStep.output}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
