import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { ingestDocument } from "@/lib/rag"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const documents = await sql`
    SELECT id, name, metadata, created_at
    FROM knowledge_documents
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
  `

  return Response.json(documents)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, content } = await req.json()

  if (!name || !content) {
    return Response.json({ error: "Name and content are required" }, { status: 400 })
  }

  try {
    const result = await ingestDocument(session.user.id, name, content)
    return Response.json(result)
  } catch (err) {
    console.error("Failed to ingest document:", err)
    return Response.json(
      { error: "Failed to process document" },
      { status: 500 }
    )
  }
}
