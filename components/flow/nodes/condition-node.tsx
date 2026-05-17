'use client'

import { memo, useCallback, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { GitBranch, Copy, Check } from 'lucide-react'
import { NODE_TYPE_COLORS, type ConditionNodeData } from '@/lib/flow-types'

const ConditionNode = memo(({ id, data, selected }: NodeProps) => {
  const colors = NODE_TYPE_COLORS.condition
  const nodeData = data as ConditionNodeData
  const [copied, setCopied] = useState(false)

  const copyId = useCallback(() => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [id])

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
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-purple-500 !w-3 !h-3 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 mb-1">
        <GitBranch className={`h-4 w-4 ${colors.icon}`} />
        <span className="font-medium text-sm">{nodeData.label}</span>
      </div>
      {nodeData.condition && (
        <p className="text-xs text-muted-foreground font-mono bg-background/50 px-2 py-1 rounded mt-1 truncate">
          {nodeData.condition}
        </p>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '30%' }}
        className="!bg-green-500 !w-3 !h-3 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '70%' }}
        className="!bg-red-500 !w-3 !h-3 !border-2 !border-white"
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
        <span className="text-green-600">{nodeData.trueLabel || 'True'}</span>
        <span className="text-red-600">{nodeData.falseLabel || 'False'}</span>
      </div>
      <button
        onClick={copyId}
        className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground font-mono transition-colors"
        title="Click to copy node ID"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
        <span>{id}</span>
      </button>
    </div>
  )
})

ConditionNode.displayName = 'ConditionNode'

export default ConditionNode
