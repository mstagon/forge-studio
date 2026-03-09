import type { IPty } from 'node-pty'
import { platform } from 'os'
import { BrowserWindow } from 'electron'
import { IPC } from '../../shared/constants/channels'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pty = require('node-pty')

export interface WorkflowStepDef {
  id: string
  name: string
  command: string
  type: 'auto' | 'gate'
}

export interface WorkflowRunState {
  id: string
  steps: WorkflowStepStatus[]
  currentStep: number
  status: 'idle' | 'running' | 'paused' | 'done' | 'failed'
}

export interface WorkflowStepStatus {
  id: string
  name: string
  command: string
  type: 'auto' | 'gate'
  status: 'pending' | 'running' | 'done' | 'failed' | 'skipped' | 'waiting'
  output: string
}

let currentRun: WorkflowRunState | null = null
let currentPty: IPty | null = null
let mainWindow: BrowserWindow | null = null

export function initWorkflowRunner(win: BrowserWindow): void {
  mainWindow = win
}

function emit(state: WorkflowRunState): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC.WORKFLOW_STATE, state)
  }
}

export function getWorkflowState(): WorkflowRunState | null {
  return currentRun
}

export function startWorkflow(projectPath: string, steps: WorkflowStepDef[]): WorkflowRunState {
  if (currentRun?.status === 'running') {
    throw new Error('A workflow is already running')
  }

  currentRun = {
    id: `wf-${Date.now()}`,
    steps: steps.map((s) => ({
      ...s,
      status: 'pending',
      output: ''
    })),
    currentStep: 0,
    status: 'running'
  }

  emit(currentRun)
  runNextStep(projectPath)
  return currentRun
}

function runNextStep(projectPath: string): void {
  if (!currentRun) return

  if (currentRun.currentStep >= currentRun.steps.length) {
    currentRun.status = 'done'
    emit(currentRun)
    return
  }

  const step = currentRun.steps[currentRun.currentStep]

  // Gate steps pause for user approval
  if (step.type === 'gate') {
    step.status = 'waiting'
    currentRun.status = 'paused'
    emit(currentRun)
    return
  }

  // Auto steps run via Claude CLI in a PTY
  step.status = 'running'
  emit(currentRun)

  const shell = platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/zsh'
  const claudeCmd = `claude --dangerously-skip-permissions -p "${step.command}"; exit $?\n`

  // Remove CLAUDECODE to allow nested claude CLI invocations
  const { CLAUDECODE: _, ...cleanEnv } = process.env

  const ptyProcess: IPty = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 120,
    rows: 30,
    cwd: projectPath,
    env: {
      ...cleanEnv,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor'
    }
  })
  currentPty = ptyProcess

  let output = ''
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null
  let lastDataAt = Date.now()

  const TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes no-output timeout

  ptyProcess.onData((data: string) => {
    output += data
    lastDataAt = Date.now()
    step.output = output.slice(-5000)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC.WORKFLOW_OUTPUT, currentRun!.id, step.id, data)
    }
  })

  ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
    if (timeoutTimer) clearInterval(timeoutTimer)
    currentPty = null
    if (!currentRun) return

    step.status = exitCode === 0 ? 'done' : 'failed'

    if (exitCode !== 0) {
      currentRun.status = 'failed'
      emit(currentRun)
      return
    }

    currentRun.currentStep++
    emit(currentRun)
    runNextStep(projectPath)
  })

  // Check for timeout every 30s — kill if no output for TIMEOUT_MS
  timeoutTimer = setInterval(() => {
    if (Date.now() - lastDataAt > TIMEOUT_MS && currentPty) {
      step.output += '\n\n[Forge Studio] Timeout: no output for 5 minutes. Process killed.'
      currentPty.kill()
      currentPty = null
    }
  }, 30_000)

  // Small delay to let shell init, then send command
  setTimeout(() => {
    if (currentPty) {
      currentPty.write(claudeCmd)
    }
  }, 500)
}

export function approveGate(projectPath: string): void {
  if (!currentRun || currentRun.status !== 'paused') return

  const step = currentRun.steps[currentRun.currentStep]
  step.status = 'done'
  currentRun.currentStep++
  currentRun.status = 'running'
  emit(currentRun)
  runNextStep(projectPath)
}

export function skipStep(projectPath: string): void {
  if (!currentRun) return

  const step = currentRun.steps[currentRun.currentStep]
  step.status = 'skipped'
  currentRun.currentStep++

  if (currentRun.currentStep >= currentRun.steps.length) {
    currentRun.status = 'done'
  }

  emit(currentRun)

  if (currentRun.status !== 'done') {
    runNextStep(projectPath)
  }
}

export function stopWorkflow(): void {
  if (currentPty) {
    currentPty.kill()
    currentPty = null
  }

  if (currentRun) {
    const step = currentRun.steps[currentRun.currentStep]
    if (step && step.status === 'running') {
      step.status = 'failed'
    }
    currentRun.status = 'failed'
    emit(currentRun)
  }
}
