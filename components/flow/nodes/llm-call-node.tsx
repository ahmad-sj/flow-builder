'use client'

import { memo, useCallback, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Brain, Copy, Check } from 'lucide-react'
import { NODE_TYPE_COLORS, type LLMCallNodeData } from '@/lib/flow-types'

const LLMCallNode = memo(({ id, data, selected }: { id: string; data: unknown; selected: boolean }) => {
  const nodeData = data as LLMCallNodeData
  const colors = NODE_TYPE_COLORS.llm_call
  const [copied, setCopied] = useState(false)

  const copyId = useCallback(() => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [id])

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[200px] ${colors.bg} ${
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
        className="!bg-pink-500 !w-3 !h-3 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 mb-1">
        <Brain className={`h-4 w-4 ${colors.icon}`} />
        <span className="font-medium text-sm">{nodeData.label}</span>
      </div>
      <div className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded mt-1">
        {nodeData.model}
      </div>
      {nodeData.prompt && (
        <p className="text-xs text-muted-foreground mt-1 truncate max-w-[180px]">
          {nodeData.prompt}
        </p>
      )}
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
        className="!bg-pink-500 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  )
})

LLMCallNode.displayName = 'LLMCallNode'

export default LLMCallNode
