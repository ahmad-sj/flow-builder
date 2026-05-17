"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { useCallback, useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Send, Bot, User, Loader2, Wrench } from "lucide-react"
import type { Node, Edge } from "@xyflow/react"

interface AIChatPanelProps {
  flowId: string
  nodes: Node[]
  edges: Edge[]
  onFlowUpdate: (nodes: Node[], edges: Edge[]) => void
  onClose: () => void
}

function getMessageText(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ""
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

export function AIChatPanel({ flowId, nodes, edges, onFlowUpdate, onClose }: AIChatPanelProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const refreshCanvas = useCallback(() => {
    fetch(`/api/flows/${flowId}`)
      .then(r => r.json())
      .then(data => {
        if (!data) return
        const updatedNodes = typeof data.nodes === "string" ? JSON.parse(data.nodes) : data.nodes
        const updatedEdges = typeof data.edges === "string" ? JSON.parse(data.edges) : data.edges
        // Normalize node types from camelCase to snake_case
        const typeMap: Record<string, string> = {
          httpRequest: "http_request",
          codeRunner: "code_runner",
          llmCall: "llm_call",
        }
        const normalizedNodes = updatedNodes?.map((n: Node) => ({
          ...n,
          type: typeMap[n.type || ""] || n.type,
        })) || []
        // Normalize edges - ensure sourceHandle is properly set
        const normalizedEdges = updatedEdges?.map((e: Record<string, unknown>) => ({
          ...e,
          sourceHandle: e.sourceHandle || undefined,
        })) || []
        if (normalizedNodes && normalizedEdges) {
          onFlowUpdate(normalizedNodes, normalizedEdges)
        }
      })
      .catch(() => {})
  }, [flowId, onFlowUpdate])

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          id,
          messages,
          flowId,
          currentNodes: nodes,
          currentEdges: edges,
        },
      }),
    }),
    onFinish: refreshCanvas,
  })

  const isStreaming = status === "streaming" || status === "submitted"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    sendMessage({ text: input })
    setInput("")
  }, [input, isStreaming, sendMessage])

  return (
    <div className="flex w-96 flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">AI Assistant</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Close AI panel</span>
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Bot className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">FlowBuilder AI</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ask me to build flows, add nodes, or modify your workflow.
              </p>
            </div>
            <div className="mt-4 space-y-2 text-left">
              {[
                "Create a flow that fetches weather data",
                "Add an HTTP request node to this flow",
                "Connect the trigger to the API call",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    sendMessage({ text: suggestion })
                  }}
                  className="block w-full rounded-md border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`mb-4 flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
<div className={`max-w-[85%] space-y-2 ${msg.role === "user" ? "order-first" : ""}`}>
               {msg.parts?.map((part, i) => {
                 if (part.type === "text" && part.text) {
                   return (
                     <div
                       key={i}
                       className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                         msg.role === "user"
                           ? "bg-primary text-primary-foreground"
                           : "bg-muted text-foreground"
                       }`}
                     >
                       {part.text}
                     </div>
                   )
                 }
if (part.type === "tool-invocation") {
                    const toolPart = part as unknown as { toolName: string; state: string }
                    return (
                      <div key={i} className="rounded-md border border-border bg-background px-3 py-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Wrench className="h-3 w-3" />
                          <span className="font-mono">{toolPart.toolName}</span>
                          {toolPart.state === "output-available" && (
                            <span className="text-emerald-500">completed</span>
                          )}
                          {(toolPart.state === "input-available" || toolPart.state === "input-streaming") && (
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          )}
                        </div>
                      </div>
                    )
                  }
return null
                })}
            </div>
            {msg.role === "user" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground/10">
                <User className="h-3.5 w-3.5 text-foreground" />
              </div>
            )}
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="rounded-lg bg-muted px-3 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to build your flow..."
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isStreaming}
          />
          <Button type="submit" size="icon" className="h-8 w-8" disabled={isStreaming || !input.trim()}>
            <Send className="h-3.5 w-3.5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
