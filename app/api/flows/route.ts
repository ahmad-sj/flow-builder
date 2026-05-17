import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { z } from 'zod'

const flowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(z.any()).default([]),
  edges: z.array(z.any()).default([]),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const flows = await sql`
      SELECT id, name, description, nodes, edges, is_active, created_at, updated_at
      FROM flows
      WHERE user_id = ${session.user.id}
      ORDER BY updated_at DESC
    `

    return NextResponse.json({ flows })
  } catch (error) {
    console.error('Error fetching flows:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, nodes, edges } = flowSchema.parse(body)

    const result = await sql`
      INSERT INTO flows (user_id, name, description, nodes, edges)
      VALUES (${session.user.id}, ${name}, ${description || null}, ${JSON.stringify(nodes)}, ${JSON.stringify(edges)})
      RETURNING id, name, description, nodes, edges, is_active, created_at, updated_at
    `

    return NextResponse.json({ flow: result[0] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Error creating flow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
