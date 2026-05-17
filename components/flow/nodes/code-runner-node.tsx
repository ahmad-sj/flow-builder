'use client'

import { memo, useCallback, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Code, Copy, Check } from 'lucide-react'
import { NODE_TYPE_COLORS, type CodeRunnerNodeData } from '@/lib/flow-types'

const CodeRunnerNode = memo(({ id, data, selected }: NodeProps) => {
  const colors = NODE_TYPE_COLORS.code_runner
  const nodeData = data as CodeRunnerNodeData
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
        className="!bg-amber-500 !w-3 !h-3 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 mb-1">
        <Code className={`h-4 w-4 ${colors.icon}`} />
        <span className="font-medium text-sm">{nodeData.label}</span>
      </div>
      {nodeData.description && (
        <p className="text-xs text-muted-foreground">{nodeData.description}</p>
      )}
      <div className="mt-2 px-2 py-1 bg-background/50 rounded text-xs font-mono text-muted-foreground truncate">
        {nodeData.language === 'javascript' ? 'JS' : 'PY'}
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
        className="!bg-amber-500 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  )
})

CodeRunnerNode.displayName = 'CodeRunnerNode'

export default CodeRunnerNode
