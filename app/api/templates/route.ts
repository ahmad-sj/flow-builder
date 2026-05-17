import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { TEMPLATES, CATEGORY_LABELS } from "@/lib/templates"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const search = searchParams.get("search")?.toLowerCase()

  let templates = TEMPLATES

  if (category && category !== "all") {
    templates = templates.filter((t) => t.category === category)
  }

  if (search) {
    templates = templates.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        CATEGORY_LABELS[t.category].toLowerCase().includes(search)
    )
  }

  return NextResponse.json({
    templates,
    categories: Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
  })
}
