"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { FlowCanvas } from "@/components/flow/flow-canvas"
import { FlowToolbar } from "@/components/flow/flow-toolbar"
import { ExecutionLog, type ExecutionStep } from "@/components/flow/execution-log"
import { AIChatPanel } from "@/components/ai/ai-chat-panel"
import type { Node, Edge } from "@xyflow/react"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function FlowEditorPage() {
  const params = useParams()
  const router = useRouter()
  const flowId = params.id as string

  const { data: flow, error, mutate } = useSWR(`/api/flows/${flowId}`, fetcher)

  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([])
  const [showExecLog, setShowExecLog] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)

  // Normalize node types from camelCase to snake_case (fix for legacy AI-created nodes)
  const typeMap: Record<string, string> = {
    httpRequest: "http_request",
    codeRunner: "code_runner",
    llmCall: "llm_call",
  }

  useEffect(() => {
    if (flow) {
      const parsedNodes = typeof flow.nodes === "string" ? JSON.parse(flow.nodes) : flow.nodes || []
      const normalizedNodes = parsedNodes.map((n: Node) => ({
        ...n,
        type: typeMap[n.type || ""] || n.type,
      }))
      const parsedEdges = typeof flow.edges === "string" ? JSON.parse(flow.edges) : flow.edges || []
      // Ensure edges have proper format
      const formattedEdges = parsedEdges.map((e: Record<string, unknown>) => ({
        ...e,
        sourceHandle: e.sourceHandle || undefined,
      }))
      setNodes(normalizedNodes)
      setEdges(formattedEdges)
    }
  }, [flow])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await fetch(`/api/flows/${flowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      })
      mutate()
    } catch (err) {
      console.error("Failed to save flow:", err)
    } finally {
      setSaving(false)
    }
  }, [flowId, nodes, edges, mutate])

  const handleRun = useCallback(async () => {
    setRunning(true)
    setExecutionSteps([])
    setShowExecLog(true)
    
    // Clear any previous execution states from the canvas
    setNodes(prev => prev.map(n => ({
      ...n,
      data: { ...n.data, isExecuting: false, hasError: false }
    })))

    try {
      const res = await fetch(`/api/flows/${flowId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        setExecutionSteps([{
          nodeId: "error",
          nodeName: "Execution Error",
          nodeType: "error",
          status: "error",
          error: errorData.error || "Failed to execute flow",
        }])
        return
      }

      const reader = res.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === "node_start") {
                setExecutionSteps(prev => [...prev, {
                  nodeId: data.nodeId,
                  nodeName: data.nodeName,
                  nodeType: data.nodeType,
                  status: "running",
                  startedAt: data.timestamp,
                }])
                setNodes(prev => prev.map(n => n.id === data.nodeId ? { ...n, data: { ...n.data, isExecuting: true, hasError: false } } : n))
              } else if (data.type === "node_complete") {
                setExecutionSteps(prev => prev.map(s =>
                  s.nodeId === data.nodeId
                    ? { ...s, status: "completed", output: data.output, completedAt: data.timestamp }
                    : s
                ))
                setNodes(prev => prev.map(n => n.id === data.nodeId ? { ...n, data: { ...n.data, isExecuting: false, hasError: false } } : n))
              } else if (data.type === "node_error") {
                setExecutionSteps(prev => prev.map(s =>
                  s.nodeId === data.nodeId
                    ? { ...s, status: "error", error: data.error, completedAt: data.timestamp }
                    : s
                ))
                setNodes(prev => prev.map(n => n.id === data.nodeId ? { ...n, data: { ...n.data, isExecuting: false, hasError: true } } : n))
              }
            } catch {
              // skip malformed SSE
            }
          }
        }
      }
    } catch (err) {
      console.error("Execution failed:", err)
    } finally {
      setRunning(false)
    }
  }, [flowId, nodes, edges])

  const handleAiFlowUpdate = useCallback((updatedNodes: Node[], updatedEdges: Edge[]) => {
    setNodes(updatedNodes)
    setEdges(updatedEdges)
  }, [])

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-destructive">Failed to load flow</p>
      </div>
    )
  }

  if (!flow) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <FlowToolbar
        flowName={flow.name}
        onSave={handleSave}
        onRun={handleRun}
        saving={saving}
        running={running}
        nodes={nodes}
        edges={edges}
      />
      <div className="relative flex flex-1 overflow-hidden">
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={setNodes}
          onEdgesChange={setEdges}
          onToggleAI={() => setAiPanelOpen(prev => !prev)}
        />
        {aiPanelOpen && (
          <AIChatPanel
            flowId={flowId}
            nodes={nodes}
            edges={edges}
            onFlowUpdate={handleAiFlowUpdate}
            onClose={() => setAiPanelOpen(false)}
          />
        )}
      </div>
      <ExecutionLog
        steps={executionSteps}
        visible={showExecLog}
        onToggle={() => setShowExecLog(false)}
      />
    </div>
  )
}
