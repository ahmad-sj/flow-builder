import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const docs = await sql`
    SELECT id FROM knowledge_documents WHERE id = ${id} AND user_id = ${session.user.id}
  `
  if (docs.length === 0) {
    return Response.json({ error: "Document not found" }, { status: 404 })
  }

  await sql`DELETE FROM knowledge_documents WHERE id = ${id}`
  return Response.json({ success: true })
}
