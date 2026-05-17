'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Palette } from 'lucide-react'
import { NODE_TYPE_COLORS, type ColorNodeData } from '@/lib/flow-types'

const ColorNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as ColorNodeData
  const colors = NODE_TYPE_COLORS.color

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
        className="!bg-rose-500 !w-3 !h-3 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 mb-1">
        <Palette className={`h-4 w-4 ${colors.icon}`} />
        <span className="font-medium text-sm">{nodeData.label || 'Color'}</span>
      </div>
      {nodeData.description && (
        <p className="text-xs text-muted-foreground">{nodeData.description}</p>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-rose-500 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  )
})

ColorNode.displayName = 'ColorNode'

export default ColorNode