import type { IPty } from 'node-pty'
import { platform } from 'os'

// node-pty는 native 모듈이므로 dynamic require 사용
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pty = require('node-pty')

interface PtySession {
  id: string
  process: IPty
  cwd: string
}

const sessions = new Map<string, PtySession>()
let nextId = 0

export function createPtySession(cwd: string): string {
  const id = `pty-${++nextId}`
  const shell = platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/zsh'

  // Remove CLAUDECODE to allow nested claude CLI invocations
  const { CLAUDECODE: _, ...cleanEnv } = process.env

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 120,
    rows: 30,
    cwd,
    encoding: 'utf8',
    env: {
      ...cleanEnv,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      LANG: cleanEnv.LANG || 'en_US.UTF-8'
    }
  })

  sessions.set(id, { id, process: ptyProcess, cwd })
  return id
}

export function writeToPty(id: string, data: string): void {
  const session = sessions.get(id)
  if (session) {
    session.process.write(data)
  }
}

export function resizePty(id: string, cols: number, rows: number): void {
  const session = sessions.get(id)
  if (session) {
    session.process.resize(cols, rows)
  }
}

export function onPtyData(id: string, callback: (data: string) => void): void {
  const session = sessions.get(id)
  if (session) {
    session.process.onData(callback)
  }
}

export function onPtyExit(id: string, callback: (exitCode: number) => void): void {
  const session = sessions.get(id)
  if (session) {
    session.process.onExit(({ exitCode }) => {
      sessions.delete(id)
      callback(exitCode)
    })
  }
}

export function disposePty(id: string): void {
  const session = sessions.get(id)
  if (session) {
    session.process.kill()
    sessions.delete(id)
  }
}

export function disposeAll(): void {
  sessions.forEach((session) => {
    session.process.kill()
  })
  sessions.clear()
}
