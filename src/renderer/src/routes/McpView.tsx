import { useState, useEffect } from 'react'
import { Plug, Circle, ExternalLink } from 'lucide-react'
import type { McpServerConfig } from '../../../shared/types/agent.types'

export function McpView(): React.ReactElement {
  const [servers, setServers] = useState<McpServerConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.forgeApi.mcp.list().then((data: McpServerConfig[]) => {
      setServers(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="h-full flex items-center justify-center text-text-secondary">Loading MCP servers...</div>
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Plug size={20} className="text-text-secondary" />
        <h2 className="text-lg font-semibold text-text-primary">MCP Servers</h2>
        <span className="text-sm text-text-secondary">from ~/.claude.json</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {servers.length === 0 ? (
          <div className="text-center py-12">
            <Plug size={48} className="text-text-secondary mx-auto mb-4 opacity-20" />
            <p className="text-text-secondary mb-2">No MCP servers configured.</p>
            <p className="text-sm text-text-secondary">
              Add servers via Claude Code CLI:
            </p>
            <code className="text-xs bg-surface px-3 py-1.5 rounded mt-2 inline-block text-text-primary font-mono">
              claude mcp add server-name -- command args
            </code>
          </div>
        ) : (
          <div className="space-y-3">
            {servers.map((server) => (
              <div key={server.name} className="bg-surface border border-border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Circle size={8} className="fill-success text-success" />
                  <h3 className="font-semibold text-text-primary">{server.name}</h3>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-text-secondary w-20 shrink-0">Command</span>
                    <code className="text-text-primary font-mono text-xs bg-bg px-2 py-0.5 rounded">
                      {server.command} {server.args.join(' ')}
                    </code>
                  </div>

                  {server.env && Object.keys(server.env).length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-text-secondary w-20 shrink-0">Env vars</span>
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

        {/* Common MCP servers reference */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Popular MCP Servers</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'context7', desc: 'Package docs lookup', cmd: 'npx -y @upstash/context7-mcp@latest' },
              { name: 'github', desc: 'GitHub PR/Issues', cmd: 'npx -y @modelcontextprotocol/server-github' },
              { name: 'sequential-thinking', desc: 'Complex reasoning', cmd: 'npx -y @modelcontextprotocol/server-sequential-thinking' },
              { name: 'filesystem', desc: 'File system access', cmd: 'npx -y @modelcontextprotocol/server-filesystem' }
            ].map((s) => (
              <div key={s.name} className="bg-bg border border-border rounded-lg p-3 text-sm">
                <div className="font-medium text-text-primary mb-1">{s.name}</div>
                <div className="text-xs text-text-secondary mb-2">{s.desc}</div>
                <code className="text-xs text-text-secondary font-mono break-all">{s.cmd}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
