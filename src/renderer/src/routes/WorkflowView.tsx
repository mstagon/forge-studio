import { Play, Square, ChevronRight, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '../stores/app.store'
import { clsx } from 'clsx'

interface WorkflowStep {
  id: string
  name: string
  command: string
  status: 'pending' | 'running' | 'done' | 'failed'
}

const DEFAULT_WORKFLOW: WorkflowStep[] = [
  { id: '1', name: 'Plan Feature', command: '/project:plan-feature', status: 'pending' },
  { id: '2', name: 'Generate Spec', command: '(auto from plan)', status: 'pending' },
  { id: '3', name: 'Approve', command: '(manual gate)', status: 'pending' },
  { id: '4', name: 'Implement', command: '/project:implement', status: 'pending' },
  { id: '5', name: 'Review', command: '/project:review', status: 'pending' },
  { id: '6', name: 'Document', command: '/project:document', status: 'pending' },
  { id: '7', name: 'Pre-commit', command: '/project:pre-commit', status: 'pending' }
]

function StepIcon({ status }: { status: WorkflowStep['status'] }): React.ReactElement {
  switch (status) {
    case 'done':
      return <CheckCircle2 size={18} className="text-success" />
    case 'running':
      return <Loader2 size={18} className="text-accent animate-spin" />
    case 'failed':
      return <Circle size={18} className="text-error" />
    default:
      return <Circle size={18} className="text-text-secondary/30" />
  }
}

export function WorkflowView(): React.ReactElement {
  const project = useAppStore((s) => s.project)
  const [steps] = useState<WorkflowStep[]>(DEFAULT_WORKFLOW)
  const [featureName, setFeatureName] = useState('')

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <h2 className="text-lg font-semibold text-text-primary">Workflow Engine</h2>
        <span className="text-sm text-text-secondary">Feature Development Pipeline</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Feature input */}
        <div className="mb-8 max-w-lg">
          <label className="text-sm text-text-secondary block mb-2">Feature Name</label>
          <div className="flex gap-2">
            <input
              value={featureName}
              onChange={(e) => setFeatureName(e.target.value)}
              placeholder="e.g., product-upload"
              className="flex-1 bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
            <button
              disabled={!featureName}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Play size={16} /> Run
            </button>
          </div>
        </div>

        {/* Pipeline visualization */}
        <div className="max-w-2xl">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Pipeline Steps</h3>
          <div className="space-y-1">
            {steps.map((step, idx) => (
              <div key={step.id}>
                <div className={clsx(
                  'flex items-center gap-4 px-4 py-3 rounded-lg border transition-colors',
                  step.status === 'running'
                    ? 'bg-accent/5 border-accent/30'
                    : step.status === 'done'
                    ? 'bg-success/5 border-success/20'
                    : 'bg-surface border-border'
                )}>
                  <StepIcon status={step.status} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">{step.name}</div>
                    <div className="text-xs text-text-secondary font-mono">{step.command}</div>
                  </div>
                  <span className="text-xs text-text-secondary">Step {idx + 1}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-px h-4 bg-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 max-w-2xl bg-surface border border-border rounded-lg p-4 text-sm text-text-secondary">
          <p className="mb-2">
            The Workflow Engine will execute each step sequentially, pausing at approval gates.
          </p>
          <p>
            For now, run commands directly in the terminal below. Full automation coming in the next update.
          </p>
        </div>
      </div>
    </div>
  )
}
