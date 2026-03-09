import { useEffect, useRef, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { CanvasAddon } from '@xterm/addon-canvas'
import '@xterm/xterm/css/xterm.css'
import { useAppStore } from '../../stores/app.store'

export function TerminalPanel(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const ptyIdRef = useRef<string | null>(null)
  const project = useAppStore((s) => s.project)
  const setTerminalPtyId = useAppStore((s) => s.setTerminalPtyId)

  const initTerminal = useCallback(async () => {
    if (!containerRef.current || terminalRef.current) return

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "'MesloLGS NF', 'FiraCode Nerd Font', 'Hack Nerd Font', 'JetBrainsMono Nerd Font', 'CaskaydiaCove Nerd Font', 'SF Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
      theme: {
        background: '#0D1117',
        foreground: '#E6EDF3',
        cursor: '#58A6FF',
        selectionBackground: '#264F78',
        black: '#484F58',
        red: '#FF7B72',
        green: '#3FB950',
        yellow: '#D29922',
        blue: '#58A6FF',
        magenta: '#BC8CFF',
        cyan: '#39C5CF',
        white: '#B1BAC4',
        brightBlack: '#6E7681',
        brightRed: '#FFA198',
        brightGreen: '#56D364',
        brightYellow: '#E3B341',
        brightBlue: '#79C0FF',
        brightMagenta: '#D2A8FF',
        brightCyan: '#56D4DD',
        brightWhite: '#F0F6FC'
      },
      allowProposedApi: true
    })

    const fitAddon = new FitAddon()
    const unicode11 = new Unicode11Addon()
    terminal.loadAddon(fitAddon)
    terminal.loadAddon(unicode11)
    terminal.loadAddon(new WebLinksAddon())
    terminal.unicode.activeVersion = '11'

    terminal.open(containerRef.current)

    try {
      terminal.loadAddon(new CanvasAddon())
    } catch {
      // canvas addon may fail in some environments, fall back to DOM renderer
    }

    fitAddon.fit()

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    // Create PTY session
    const homePath = await window.forgeApi.app.getPath('home').catch(() => '/')
    const cwd = project?.path || homePath
    const ptyId = await window.forgeApi.terminal.create(cwd)
    ptyIdRef.current = ptyId
    setTerminalPtyId(ptyId)

    // Terminal → PTY
    terminal.onData((data) => {
      window.forgeApi.terminal.write(ptyId, data)
    })

    // Terminal resize → PTY
    terminal.onResize(({ cols, rows }) => {
      window.forgeApi.terminal.resize(ptyId, cols, rows)
    })

    // PTY → Terminal
    const removeDataListener = window.forgeApi.terminal.onData((id, data) => {
      if (id === ptyId) {
        terminal.write(data)
      }
    })

    const removeExitListener = window.forgeApi.terminal.onExit((id, exitCode) => {
      if (id === ptyId) {
        terminal.writeln(`\r\n\x1b[90m[Process exited with code ${exitCode}]\x1b[0m`)
      }
    })

    // Cleanup
    return () => {
      removeDataListener()
      removeExitListener()
      setTerminalPtyId(null)
      window.forgeApi.terminal.dispose(ptyId)
      terminal.dispose()
    }
  }, [project?.path, setTerminalPtyId])

  useEffect(() => {
    let cleanup: (() => void) | undefined

    initTerminal().then((fn) => {
      cleanup = fn
    })

    return () => cleanup?.()
  }, [initTerminal])

  // Handle resize
  useEffect(() => {
    const handleResize = (): void => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }

    const observer = new ResizeObserver(handleResize)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div className="h-full bg-bg">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}
