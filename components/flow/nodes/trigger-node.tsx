'use client'

import { memo, useCallback, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Play, Clock, Webhook, Copy, Check } from 'lucide-react'
import { NODE_TYPE_COLORS, type TriggerNodeData } from '@/lib/flow-types'

const TriggerNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as TriggerNodeData
  const colors = NODE_TYPE_COLORS.trigger
  const [copied, setCopied] = useState(false)

  const copyId = useCallback(() => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [id])

  const getTriggerIcon = () => {
    switch (nodeData.triggerType) {
      case 'schedule':
        return <Clock className={`h-4 w-4 ${colors.icon}`} />
      case 'webhook':
        return <Webhook className={`h-4 w-4 ${colors.icon}`} />
      default:
        return <Play className={`h-4 w-4 ${colors.icon}`} />
    }
  }

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[180px] ${colors.bg} ${
        selected ? colors.border : 'border-transparent'
      } shadow-sm transition-all duration-300 hover:shadow-md ${
        nodeData.isExecuting ? 'animate-pulse ring-2 ring-primary ring-offset-2 border-primary shadow-lg scale-[1.02]' : ''
      } ${
        nodeData.hasError ? 'ring-2 ring-destructive ring-offset-2 border-destructive' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {getTriggerIcon()}
        <span className="font-medium text-sm">{nodeData.label}</span>
      </div>
      {nodeData.description && (
        <p className="text-xs text-muted-foreground">{nodeData.description}</p>
      )}
      <div className="text-xs text-muted-foreground mt-1 capitalize">
        {nodeData.triggerType} trigger
      </div>
      <button
        onClick={copyId}
        className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground font-mono transition-colors"
        title="Click to copy node ID"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
        <span>{id}</span>
      </button>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  )
})

TriggerNode.displayName = 'TriggerNode'

export default TriggerNode
