'use client'

import { type NodeType, NODE_TYPE_LABELS, NODE_TYPE_COLORS } from '@/lib/flow-types'
import { Play, Globe, Code, GitBranch, Brain, Webhook, FileText, Palette, FileDown } from 'lucide-react'

const nodeConfigs: { type: NodeType; icon: React.ReactNode }[] = [
  { type: 'trigger', icon: <Play className="h-4 w-4" /> },
  { type: 'http_request', icon: <Globe className="h-4 w-4" /> },
  { type: 'code_runner', icon: <Code className="h-4 w-4" /> },
  { type: 'condition', icon: <GitBranch className="h-4 w-4" /> },
  { type: 'llm_call', icon: <Brain className="h-4 w-4" /> },
  { type: 'webhook', icon: <Webhook className="h-4 w-4" /> },
  { type: 'log', icon: <FileText className="h-4 w-4" /> },
  { type: 'color', icon: <Palette className="h-4 w-4" /> },
  { type: 'save_pdf', icon: <FileDown className="h-4 w-4" /> },
]

export function NodePanel() {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="p-4 space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Nodes
      </h3>
      <div className="space-y-2">
        {nodeConfigs.map(({ type, icon }) => {
          const colors = NODE_TYPE_COLORS[type]
          return (
            <div
              key={type}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-grab border ${colors.bg} hover:shadow-md transition-all active:cursor-grabbing`}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
            >
              <div className={colors.icon}>{icon}</div>
              <span className="text-sm font-medium">{NODE_TYPE_LABELS[type]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
