'use client'

import { memo, useCallback, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Globe, Copy, Check } from 'lucide-react'
import { NODE_TYPE_COLORS, type HttpRequestNodeData } from '@/lib/flow-types'

const HttpRequestNode = memo(({ id, data, selected }: NodeProps) => {
  const colors = NODE_TYPE_COLORS.http_request
  const nodeData = data as HttpRequestNodeData
  const [copied, setCopied] = useState(false)

  const copyId = useCallback(() => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [id])

  const getMethodColor = (method: string) => {
    const methodColors: Record<string, string> = {
      GET: 'bg-green-100 text-green-700',
      POST: 'bg-blue-100 text-blue-700',
      PUT: 'bg-yellow-100 text-yellow-700',
      DELETE: 'bg-red-100 text-red-700',
      PATCH: 'bg-purple-100 text-purple-700',
    }
    return methodColors[method] || 'bg-gray-100 text-gray-700'
  }

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
        className="!bg-blue-500 !w-3 !h-3 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 mb-1">
        <Globe className={`h-4 w-4 ${colors.icon}`} />
        <span className="font-medium text-sm">{nodeData.label}</span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${getMethodColor(nodeData.method)}`}>
          {nodeData.method}
        </span>
        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
          {nodeData.url || 'No URL set'}
        </span>
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
        className="!bg-blue-500 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  )
})

HttpRequestNode.displayName = 'HttpRequestNode'

export default HttpRequestNode
