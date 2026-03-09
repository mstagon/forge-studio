import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plug, Circle, Plus, Trash2, X } from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from '../stores/toast.store'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import type { McpServerConfig } from '../../../shared/types/agent.types'

const POPULAR_SERVERS = [
  { name: 'context7', cmd: 'npx', args: ['-y', '@upstash/context7-mcp@latest'] },
  { name: 'github', cmd: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] },
  { name: 'sequential-thinking', cmd: 'npx', args: ['-y', '@modelcontextprotocol/server-sequential-thinking'] },
  { name: 'filesystem', cmd: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] },
  { name: 'postgres', cmd: 'npx', args: ['-y', '@modelcontextprotocol/server-postgres'] },
  { name: 'memory', cmd: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'] }
]

export function McpView(): React.ReactElement {
  const { t } = useTranslation()
  const [servers, setServers] = useState<McpServerConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [addName, setAddName] = useState('')
  const [addCommand, setAddCommand] = useState('')
  const [addArgs, setAddArgs] = useState('')
  const [addEnvKey, setAddEnvKey] = useState('')
  const [addEnvVal, setAddEnvVal] = useState('')
  const [envPairs, setEnvPairs] = useState<{ key: string; value: string }[]>([])

  const loadServers = (): void => {
    window.forgeApi.mcp.list().then((data: McpServerConfig[]) => {
      setServers(data)
      setLoading(false)
    }).catch(() => { setLoading(false) })
  }

  useEffect(() => { loadServers() }, [])

  const handleAdd = async (): Promise<void> => {
    if (!addName || !addCommand) return
    setAdding(true)
    try {
      const args = addArgs.trim() ? addArgs.trim().split(/\s+/) : []
      const env = envPairs.length > 0
        ? Object.fromEntries(envPairs.map((p) => [p.key, p.value]))
        : undefined
      await window.forgeApi.mcp.add(addName, addCommand, args, env)
      toast.success(t('mcp.added', { name: addName }))
      setShowAdd(false)
      setAddName('')
      setAddCommand('')
      setAddArgs('')
      setEnvPairs([])
      loadServers()
    } catch (err) {
      toast.error(t('mcp.addFailed', { error: err instanceof Error ? err.message : String(err) }))
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (name: string): Promise<void> => {
    try {
      await window.forgeApi.mcp.remove(name)
      toast.success(t('mcp.removed', { name }))
      setConfirmRemove(null)
      loadServers()
    } catch (err) {
      toast.error(t('mcp.removeFailed', { error: err instanceof Error ? err.message : String(err) }))
    }
  }

  const handleQuickAdd = async (server: typeof POPULAR_SERVERS[0]): Promise<void> => {
    if (servers.some((s) => s.name === server.name)) return
    try {
      await window.forgeApi.mcp.add(server.name, server.cmd, server.args)
      toast.success(t('mcp.added', { name: server.name }))
      loadServers()
    } catch (err) {
      toast.error(t('mcp.addFailed', { error: err instanceof Error ? err.message : String(err) }))
    }
  }

  const addEnvPair = (): void => {
    if (!addEnvKey) return
    setEnvPairs([...envPairs, { key: addEnvKey, value: addEnvVal }])
    setAddEnvKey('')
    setAddEnvVal('')
  }

  if (loading) {
    return <div className="h-full flex items-center justify-center text-text-secondary">{t('mcp.loading')}</div>
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Plug size={20} className="text-text-secondary" />
        <h2 className="text-lg font-semibold text-text-primary">{t('mcp.title')}</h2>
        <span className="text-sm text-text-secondary">{t('mcp.configFile')}</span>
        <button
          onClick={() => setShowAdd(true)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-accent text-bg rounded text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus size={14} /> {t('mcp.addServer')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Add form */}
        {showAdd && (
          <div className="mb-6 bg-surface border border-accent/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary">{t('mcp.addTitle')}</h3>
              <button onClick={() => setShowAdd(false)} className="text-text-secondary hover:text-text-primary">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary block mb-1">{t('mcp.serverName')}</label>
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder={t('mcp.serverNamePlaceholder')}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">{t('mcp.commandLabel')}</label>
                <input
                  value={addCommand}
                  onChange={(e) => setAddCommand(e.target.value)}
                  placeholder={t('mcp.commandPlaceholder')}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">{t('mcp.arguments')}</label>
                <input
                  value={addArgs}
                  onChange={(e) => setAddArgs(e.target.value)}
                  placeholder={t('mcp.argumentsPlaceholder')}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">{t('mcp.envVars')}</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={addEnvKey}
                    onChange={(e) => setAddEnvKey(e.target.value)}
                    placeholder={t('mcp.envKeyPlaceholder')}
                    className="flex-1 bg-bg border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                  <input
                    value={addEnvVal}
                    onChange={(e) => setAddEnvVal(e.target.value)}
                    placeholder={t('mcp.envValuePlaceholder')}
                    className="flex-1 bg-bg border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                  <button onClick={addEnvPair} className="px-2 py-1.5 bg-surface border border-border rounded text-xs text-text-secondary hover:text-text-primary">
                    <Plus size={12} />
                  </button>
                </div>
                {envPairs.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs mb-1">
                    <span className="text-warning">{p.key}</span>
                    <span className="text-text-secondary">=</span>
                    <span className="text-text-primary">{p.value}</span>
                    <button onClick={() => setEnvPairs(envPairs.filter((_, j) => j !== i))} className="text-text-secondary hover:text-error">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAdd}
                disabled={!addName || !addCommand || adding}
                className="px-4 py-2 bg-accent text-bg rounded text-sm font-medium hover:bg-accent/90 disabled:opacity-30 transition-colors"
              >
                {adding ? t('mcp.adding') : t('common.add')}
              </button>
            </div>
          </div>
        )}

        {/* Server list */}
        {servers.length === 0 && !showAdd ? (
          <div className="text-center py-12">
            <Plug size={48} className="text-text-secondary mx-auto mb-4 opacity-20" />
            <p className="text-text-secondary mb-2">{t('mcp.emptyState')}</p>
            <p className="text-sm text-text-secondary">
              {t('mcp.emptyStateHint')}
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {servers.map((server) => (
              <div key={server.name} className="bg-surface border border-border rounded-lg p-4 group">
                <div className="flex items-center gap-3 mb-3">
                  <Circle size={8} className="fill-success text-success" />
                  <h3 className="font-semibold text-text-primary">{server.name}</h3>
                  <button
                    onClick={() => setConfirmRemove(server.name)}
                    className="ml-auto opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-error/10 text-text-secondary hover:text-error transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-text-secondary w-20 shrink-0">{t('mcp.commandLabel')}</span>
                    <code className="text-text-primary font-mono text-xs bg-bg px-2 py-0.5 rounded">
                      {server.command} {server.args.join(' ')}
                    </code>
                  </div>
                  {server.env && Object.keys(server.env).length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-text-secondary w-20 shrink-0">Env</span>
                      <div className="flex flex-wrap gap-1">
                        {Object.keys(server.env).map((key) => (
                          <span key={key} className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded border border-warning/20">
                            {key}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick add popular servers */}
        <div>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">{t('mcp.quickAdd')}</h3>
          <div className="grid grid-cols-2 gap-2">
            {POPULAR_SERVERS.map((s) => {
              const installed = servers.some((sv) => sv.name === s.name)
              return (
                <button
                  key={s.name}
                  onClick={() => handleQuickAdd(s)}
                  disabled={installed}
                  className={clsx(
                    'text-left bg-bg border rounded-lg p-3 text-sm transition-colors',
                    installed
                      ? 'border-success/20 opacity-60 cursor-default'
                      : 'border-border hover:border-accent cursor-pointer'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text-primary">{s.name}</span>
                    {installed && <span className="text-[10px] text-success">{t('mcp.installed')}</span>}
                  </div>
                  <div className="text-xs text-text-secondary">{t(`mcp.servers.${s.name}`)}</div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {confirmRemove && (
        <ConfirmDialog
          title={t('mcp.removeTitle')}
          message={t('mcp.removeMessage', { name: confirmRemove })}
          confirmLabel={t('common.remove')}
          onConfirm={() => handleRemove(confirmRemove)}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
    </div>
  )
}
