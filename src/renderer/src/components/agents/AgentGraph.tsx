import { useMemo, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps
} from 'reactflow'
import 'reactflow/dist/style.css'
import { clsx } from 'clsx'
import type { AgentConfig } from '../../../../shared/types/agent.types'

const GROUP_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  planning: { bg: 'bg-agent-plan/20', border: 'border-agent-plan/50', text: 'text-agent-plan' },
  development: { bg: 'bg-agent-dev/20', border: 'border-agent-dev/50', text: 'text-agent-dev' },
  review: { bg: 'bg-agent-review/20', border: 'border-agent-review/50', text: 'text-agent-review' },
  documentation: { bg: 'bg-agent-doc/20', border: 'border-agent-doc/50', text: 'text-agent-doc' },
  custom: { bg: 'bg-surface', border: 'border-border', text: 'text-text-secondary' }
}

interface AgentNodeData {
  label: string
  group: string
  fileName: string
}

function AgentNode({ data }: NodeProps<AgentNodeData>): React.ReactElement {
  const colors = GROUP_COLORS[data.group] || GROUP_COLORS.custom

  return (
    <div
      className={clsx(
        'px-4 py-3 rounded-lg border-2 min-w-[140px] shadow-lg',
        colors.bg,
        colors.border
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-accent !w-2 !h-2" />
      <div className={clsx('text-xs font-semibold uppercase tracking-wider mb-1', colors.text)}>
        {data.group}
      </div>
      <div className="text-sm font-medium text-text-primary">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-accent !w-2 !h-2" />
    </div>
  )
}

const nodeTypes = { agent: AgentNode }

// Auto-layout: group agents by group, position in columns
function layoutAgents(agents: AgentConfig[]): { nodes: Node[]; edges: Edge[] } {
  const groups = ['planning', 'development', 'review', 'documentation', 'custom']
  const groupMap = new Map<string, AgentConfig[]>()

  for (const agent of agents) {
    const list = groupMap.get(agent.group) || []
    list.push(agent)
    groupMap.set(agent.group, list)
  }

  const nodes: Node[] = []
  const edges: Edge[] = []

  let colX = 0
  const usedGroups: string[] = []

  for (const group of groups) {
    const items = groupMap.get(group)
    if (!items?.length) continue
    usedGroups.push(group)

    items.forEach((agent, i) => {
      nodes.push({
        id: agent.fileName,
        type: 'agent',
        position: { x: colX, y: i * 110 },
        data: {
          label: agent.displayName,
          group: agent.group,
          fileName: agent.fileName
        }
      })
    })

    colX += 220
  }

  // Create edges between groups (flow: planning -> development -> review -> documentation)
  for (let gi = 0; gi < usedGroups.length - 1; gi++) {
    const fromGroup = groupMap.get(usedGroups[gi])
    const toGroup = groupMap.get(usedGroups[gi + 1])
    if (!fromGroup || !toGroup) continue

    // Connect last agent in source group to first agent in target group
    const fromAgent = fromGroup[fromGroup.length - 1]
    const toAgent = toGroup[0]

    edges.push({
      id: `e-${fromAgent.fileName}-${toAgent.fileName}`,
      source: fromAgent.fileName,
      target: toAgent.fileName,
      animated: true,
      style: { stroke: '#58a6ff', strokeWidth: 2 }
    })
  }

  // Connect agents within the same group
  for (const group of usedGroups) {
    const items = groupMap.get(group)
    if (!items || items.length < 2) continue

    for (let i = 0; i < items.length - 1; i++) {
      edges.push({
        id: `e-${items[i].fileName}-${items[i + 1].fileName}`,
        source: items[i].fileName,
        target: items[i + 1].fileName,
        style: { stroke: '#484f58', strokeWidth: 1.5 }
      })
    }
  }

  return { nodes, edges }
}

interface Props {
  agents: AgentConfig[]
  onSelectAgent: (agent: AgentConfig) => void
}

export function AgentGraph({ agents, onSelectAgent }: Props): React.ReactElement {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => layoutAgents(agents), [agents])
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const agent = agents.find((a) => a.fileName === node.id)
      if (agent) onSelectAgent(agent)
    },
    [agents, onSelectAgent]
  )

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-bg"
      >
        <Background color="#21262d" gap={20} />
        <Controls className="!bg-surface !border-border !rounded-lg [&>button]:!bg-surface [&>button]:!border-border [&>button]:!fill-text-secondary" />
      </ReactFlow>
    </div>
  )
}
