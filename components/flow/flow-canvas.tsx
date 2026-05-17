"use client"

import { useCallback, useRef, useState } from "react"
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
  type ReactFlowInstance,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { nanoid } from "nanoid"
import { nodeTypes } from "./nodes"
import { NodePanel } from "./node-panel"
import { NodePropertiesPanel } from "./node-properties-panel"
import { type FlowNode, type NodeType, DEFAULT_NODE_DATA } from "@/lib/flow-types"
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"

interface FlowCanvasProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (nodes: Node[]) => void
  onEdgesChange: (edges: Edge[]) => void
  onToggleAI: () => void
}

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onToggleAI,
}: FlowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(applyNodeChanges(changes, nodes) as Node[])
    },
    [nodes, onNodesChange]
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(applyEdgeChanges(changes, edges) as Edge[])
    },
    [edges, onEdgesChange]
  )

  const onConnect = useCallback(
    (params: Connection) => {
      onEdgesChange(addEdge({ ...params, id: nanoid(), animated: true }, edges))
    },
    [edges, onEdgesChange]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData("application/reactflow") as NodeType
      if (!type || !reactFlowInstance || !reactFlowWrapper.current) return

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      const newNode: FlowNode = {
        id: nanoid(),
        type,
        position,
        data: DEFAULT_NODE_DATA[type] as FlowNode["data"],
      }

      onNodesChange([...nodes, newNode])
    },
    [reactFlowInstance, nodes, onNodesChange]
  )

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as FlowNode)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      onNodesChange(
        nodes.map((node) => (node.id === nodeId ? { ...node, data } : node))
      )
      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) => (prev ? ({ ...prev, data } as FlowNode) : null))
      }
    },
    [nodes, onNodesChange, selectedNode]
  )

  return (
    <div className="flex h-full w-full">
      {/* Node palette */}
      <div className="w-48 shrink-0 border-r border-border bg-card">
        <NodePanel />
      </div>

      {/* Canvas */}
      <div ref={reactFlowWrapper} className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          deleteKeyCode={["Backspace", "Delete"]}
          defaultEdgeOptions={{ animated: true }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls className="[&_button]:!bg-card [&_button]:!border-border [&_button]:!text-foreground" />
          <Background variant={BackgroundVariant.Dots} gap={15} size={1} className="!bg-background" />
        </ReactFlow>

        {/* AI toggle button */}
        <Button
          size="sm"
          variant="outline"
          className="absolute bottom-4 right-4 z-10 gap-1.5 shadow-md"
          onClick={onToggleAI}
        >
          <Bot className="h-4 w-4" />
          AI Assistant
        </Button>
      </div>

      {/* Properties panel */}
      {selectedNode && (
        <div className="w-72 shrink-0 overflow-y-auto border-l border-border bg-card">
          <NodePropertiesPanel
            node={selectedNode}
            onUpdate={handleNodeUpdate}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      )}
    </div>
  )
}
