import type { Node, Edge } from "@xyflow/react"

interface NodeData {
  label?: string
  method?: string
  url?: string
  headers?: string
  body?: string
  code?: string
  condition?: string
  model?: string
  prompt?: string
  systemPrompt?: string
  webhookUrl?: string
  webhookMethod?: string
  webhookHeaders?: string
  webhookBody?: string
  triggerType?: string
  schedule?: string
  [key: string]: unknown
}

export interface ExecutionContext {
  nodeOutputs: Record<string, unknown>
  variables: Record<string, unknown>
}

export type SSEWriter = (data: {
  type: string
  nodeId: string
  nodeName: string
  nodeType: string
  output?: unknown
  error?: string
  timestamp: string
}) => void

// Topological sort using Kahn's algorithm
export function topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
  const inDegree = new Map<string, number>()
  const adjacencyList = new Map<string, string[]>()
  const nodeMap = new Map<string, Node>()

  for (const node of nodes) {
    inDegree.set(node.id, 0)
    adjacencyList.set(node.id, [])
    nodeMap.set(node.id, node)
  }

  for (const edge of edges) {
    const neighbors = adjacencyList.get(edge.source) || []
    neighbors.push(edge.target)
    adjacencyList.set(edge.source, neighbors)
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
  }

  const queue: string[] = []
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(nodeId)
  }

  const sorted: Node[] = []
  while (queue.length > 0) {
    const current = queue.shift()!
    const node = nodeMap.get(current)
    if (node) sorted.push(node)

    const neighbors = adjacencyList.get(current) || []
    for (const neighbor of neighbors) {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1)
      if (inDegree.get(neighbor) === 0) queue.push(neighbor)
    }
  }

  return sorted
}

// Resolve template variables like {{nodeId.output}}
function resolveTemplate(template: string, context: ExecutionContext): string {
  return template.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_, nodeId, field) => {
    const output = context.nodeOutputs[nodeId]
    if (output && typeof output === "object" && field in (output as Record<string, unknown>)) {
      const val = (output as Record<string, unknown>)[field]
      return typeof val === "string" ? val : JSON.stringify(val)
    }
    if (field === "output") {
      return typeof output === "string" ? output : JSON.stringify(output)
    }
    return `{{${nodeId}.${field}}}`
  })
}

// Execute a single node
async function executeNode(
  node: Node,
  context: ExecutionContext,
  edges: Edge[],
): Promise<{ output: unknown; skipTargets?: string[] }> {
  const data = (node.data || {}) as NodeData
  const type = node.type || ""

  switch (type) {
    case "trigger": {
      return { output: { triggered: true, type: data.triggerType || "manual", timestamp: new Date().toISOString() } }
    }

    case "http_request": {
      const url = resolveTemplate(data.url || "", context)
      const method = (data.method || "GET").toUpperCase()
      let headers: Record<string, string> = {}
      try {
        headers = data.headers ? JSON.parse(resolveTemplate(data.headers, context)) : {}
      } catch { /* use empty headers */ }

      const fetchOptions: RequestInit = { method, headers }
      if (method !== "GET" && method !== "HEAD" && data.body) {
        fetchOptions.body = resolveTemplate(data.body, context)
      }

      try {
        const res = await fetch(url, fetchOptions)
        const text = await res.text()
        let jsonBody: unknown
        try { jsonBody = JSON.parse(text) } catch { jsonBody = text }
        return {
          output: {
            status: res.status,
            statusText: res.statusText,
            body: jsonBody,
          }
        }
      } catch (err) {
        throw new Error(`HTTP request failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    case "code_runner": {
      const code = resolveTemplate(data.code || "", context)
      try {
        const fn = new Function("context", "inputs", `
          const outputs = context.nodeOutputs;
          const vars = context.variables;
          ${code}
        `)
        const result = fn(context, context.nodeOutputs)
        return { output: result ?? { success: true } }
      } catch (err) {
        throw new Error(`Code execution error: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    case "condition": {
      const condition = resolveTemplate(data.condition || "true", context)
      let result = false
      try {
        const fn = new Function("context", "outputs", `return Boolean(${condition})`)
        result = fn(context, context.nodeOutputs)
      } catch {
        result = false
      }

      // Find outgoing edges and determine which paths to skip
      const outEdges = edges.filter(e => e.source === node.id)
      const trueEdges = outEdges.filter(e => e.sourceHandle === "true" || e.sourceHandle === "a")
      const falseEdges = outEdges.filter(e => e.sourceHandle === "false" || e.sourceHandle === "b")

      const skipTargets = result
        ? falseEdges.map(e => e.target)
        : trueEdges.map(e => e.target)

      return { output: { condition: condition, result }, skipTargets }
    }

    case "llm_call": {
      const prompt = resolveTemplate(data.prompt || "", context)
      const model = data.model || "deepseek-v4-flash"
      const systemPrompt = data.systemPrompt || ""
      const outputFormat = data.outputFormat || "text"

      try {
        const { generateText } = await import("ai")
        const { deepseek } = await import("@ai-sdk/deepseek")
        const { openai, createOpenAI } = await import("@ai-sdk/openai")
        const { google } = await import("@ai-sdk/google")

        let modelProvider
        if (model.startsWith("openrouter/")) {
          const openrouterModel = model.replace("openrouter/", "")
          const apiKey = process.env.OPENROUTER_API_KEY
          if (!apiKey) {
            throw new Error("OPENROUTER_API_KEY is not configured")
          }
          modelProvider = createOpenAI({
            apiKey,
            baseURL: "https://openrouter.ai/api/v1",
            headers: {
              "HTTP-Referer": "https://github.com/flow-builder-ai",
              "X-Title": "Flow Builder AI",
            },
          })(openrouterModel)
        } else if (model.startsWith("gemini-")) {
          modelProvider = google(model)
        } else if (model.startsWith("gpt-") || model.startsWith("o1-")) {
          modelProvider = openai(model)
        } else {
          modelProvider = deepseek(model)
        }

        const response = await generateText({
          model: modelProvider,
          system: systemPrompt || undefined,
          prompt: prompt,
        })

        if (outputFormat === "webpage") {
          // Strip markdown code block markers from LLM response
          let cleanText = response.text.replace(/^```html\s*/i, "").replace(/\s*```$/i, "").trim()
          
          const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.7; 
      color: #1a1a1a; 
      background: #fafafa;
      padding: 40px 20px;
    }
    .container { max-width: 900px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    h1, h2, h3 { color: #0a0a0a; margin: 24px 0 12px; font-weight: 600; }
    h1 { font-size: 2.25rem; border-bottom: 2px solid #0070f3; padding-bottom: 12px; }
    h2 { font-size: 1.5rem; border-bottom: 1px solid #eaeaea; padding-bottom: 8px; }
    h3 { font-size: 1.25rem; }
    p { margin: 12px 0; }
    ul, ol { margin: 12px 0; padding-left: 24px; }
    li { margin: 8px 0; }
    code { background: #f5f5f5; padding: 2px 8px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #1e1e1e; color: #e8e8e8; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #0070f3; padding-left: 16px; margin: 16px 0; color: #555; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #eaeaea; padding: 12px; text-align: left; }
    th { background: #f8f8f8; font-weight: 600; }
    .meta { font-size: 0.85rem; color: #666; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="container">
    ${cleanText}
  </div>
</body>
</html>`
          return { output: { html, text: cleanText, model, outputFormat: "webpage" } }
        }

        return { output: { text: response.text, model } }
      } catch (err) {
        throw new Error(`LLM call failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    case "webhook": {
      const url = resolveTemplate(data.webhookUrl || "", context)
      const method = (data.webhookMethod || "POST").toUpperCase()
      let headers: Record<string, string> = {}
      try {
        headers = data.webhookHeaders ? JSON.parse(resolveTemplate(data.webhookHeaders, context)) : { "Content-Type": "application/json" }
      } catch {
        headers = { "Content-Type": "application/json" }
      }

      const body = data.webhookBody
        ? resolveTemplate(data.webhookBody, context)
        : JSON.stringify(context.nodeOutputs)

      try {
        const res = await fetch(url, { method, headers, body })
        const text = await res.text()
        let jsonBody: unknown
        try { jsonBody = JSON.parse(text) } catch { jsonBody = text }
        return { output: { status: res.status, body: jsonBody } }
      } catch (err) {
        throw new Error(`Webhook failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    case "log": {
      const prefix = data.prefix || ""
      const safeStringify = (obj: unknown) => {
        const seen = new WeakSet()
        return JSON.stringify(obj, (key, value) => {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) return "[Circular]"
            seen.add(value)
          }
          return value
        }, 2)
      }
      const inputStr = safeStringify(context.nodeOutputs)
      return { output: { prefix, logged: inputStr } }
    }

    case "color": {
      const prefix = data.prefix || ""
      const safeStringify = (obj: unknown) => {
        const seen = new WeakSet()
        return JSON.stringify(obj, (key, value) => {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) return "[Circular]"
            seen.add(value)
          }
          return value
        }, 2)
      }
      const inputStr = safeStringify(context.nodeOutputs)
      const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"]
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      return { output: { prefix, color: randomColor, logged: inputStr } }
    }

    case "save_pdf": {
      const filename = data.filename || "output.pdf"
      const format = data.format || "A4"
      
      // Find the previous node's output (the node that connects to this one)
      const inEdges = edges.filter(e => e.target === node.id)
      const previousOutput = inEdges.length > 0 
        ? context.nodeOutputs[inEdges[0].source]
        : null
      
      // Extract content for PDF
      let dataToSave: string
      if (previousOutput !== undefined && previousOutput !== null) {
        const output = previousOutput as Record<string, unknown>
        // For llm_call with webpage output, extract just the html content
        if (output.outputFormat === "webpage") {
          if (typeof output.html === "string") {
            // HTML is already a string, use it directly (no need to unescape - JSON preserves it)
            dataToSave = output.html
          } else {
            dataToSave = typeof output.text === "string" ? output.text : JSON.stringify(previousOutput)
          }
        } else if (typeof output.text === "string") {
          dataToSave = output.text
        } else if (typeof output === "string") {
          dataToSave = previousOutput as string
        } else {
          dataToSave = JSON.stringify(previousOutput, null, 2)
        }
      } else {
        dataToSave = JSON.stringify(context.nodeOutputs, null, 2)
      }
      
      return { output: { filename, format, data: dataToSave, pdfGenerated: true } }
    }

    default:
      return { output: { message: `Unknown node type: ${type}` } }
  }
}

// Execute the full flow with SSE streaming
export async function executeFlow(
  nodes: Node[],
  edges: Edge[],
  write: SSEWriter,
) {
  const sortedNodes = topologicalSort(nodes, edges)
  const context: ExecutionContext = { nodeOutputs: {}, variables: {} }
  const skippedNodes = new Set<string>()

  for (const node of sortedNodes) {
    if (skippedNodes.has(node.id)) continue

    const data = (node.data || {}) as NodeData
    const nodeName = (data.label as string) || node.type || "Unknown"
    const nodeType = node.type || "unknown"

    write({
      type: "node_start",
      nodeId: node.id,
      nodeName,
      nodeType,
      timestamp: new Date().toISOString(),
    })

    try {
      const { output, skipTargets } = await executeNode(node, context, edges)
      context.nodeOutputs[node.id] = output

      if (skipTargets) {
        for (const target of skipTargets) {
          skippedNodes.add(target)
        }
      }

      write({
        type: "node_complete",
        nodeId: node.id,
        nodeName,
        nodeType,
        output,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      write({
        type: "node_error",
        nodeId: node.id,
        nodeName,
        nodeType,
        error,
        timestamp: new Date().toISOString(),
      })
      // Stop execution on error
      break
    }
  }

  write({
    type: "flow_complete",
    nodeId: "flow",
    nodeName: "Flow",
    nodeType: "flow",
    output: context.nodeOutputs,
    timestamp: new Date().toISOString(),
  })
}
