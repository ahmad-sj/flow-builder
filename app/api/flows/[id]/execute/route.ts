import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { executeFlow, type SSEWriter } from "@/lib/flow-engine"
import { sql } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const { id } = await params

  // Verify flow ownership
  const flows = await sql`SELECT id FROM flows WHERE id = ${id} AND user_id = ${session.user.id}`
  if (flows.length === 0) {
    return new Response(JSON.stringify({ error: "Flow not found" }), { status: 404 })
  }

  const body = await request.json()
  const { nodes, edges } = body

  if (!nodes || !edges) {
    return new Response(JSON.stringify({ error: "Missing nodes or edges" }), { status: 400 })
  }

  // Create a flow run record
  const runs = await sql`
    INSERT INTO flow_runs (flow_id, status, trigger_type, input)
    VALUES (${id}, 'running', 'manual', ${JSON.stringify({ nodeCount: nodes.length })})
    RETURNING id
  `
  const runId = runs[0].id

  // SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const write: SSEWriter = (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        await executeFlow(nodes, edges, write)

        // Update run status
        await sql`
          UPDATE flow_runs SET status = 'completed', completed_at = NOW()
          WHERE id = ${runId}
        `
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err)
        write({
          type: "flow_error",
          nodeId: "flow",
          nodeName: "Flow",
          nodeType: "flow",
          error,
          timestamp: new Date().toISOString(),
        })

        await sql`
          UPDATE flow_runs SET status = 'failed', error = ${error}, completed_at = NOW()
          WHERE id = ${runId}
        `
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
