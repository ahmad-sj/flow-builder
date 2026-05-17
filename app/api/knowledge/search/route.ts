import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { searchDocuments } from "@/lib/rag"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { query, limit } = await req.json()

  if (!query) {
    return Response.json({ error: "Query is required" }, { status: 400 })
  }

  try {
    const results = await searchDocuments(session.user.id, query, limit || 5)
    return Response.json(results)
  } catch (err) {
    console.error("Search failed:", err)
    return Response.json({ error: "Search failed" }, { status: 500 })
  }
}
