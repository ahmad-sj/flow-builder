import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { z } from 'zod'

const updateFlowSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  is_active: z.boolean().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const flows = await sql`
      SELECT id, name, description, nodes, edges, is_active, created_at, updated_at
      FROM flows
      WHERE id = ${id} AND user_id = ${session.user.id}
    `

    if (flows.length === 0) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    return NextResponse.json(flows[0])
  } catch (error) {
    console.error('Error fetching flow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const updates = updateFlowSchema.parse(body)

    // Build dynamic update query
    const setClauses: string[] = []
    const values: (string | boolean | null)[] = []
    let paramIndex = 1

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`)
      values.push(updates.name)
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`)
      values.push(updates.description)
    }
    if (updates.nodes !== undefined) {
      setClauses.push(`nodes = $${paramIndex++}`)
      values.push(JSON.stringify(updates.nodes))
    }
    if (updates.edges !== undefined) {
      setClauses.push(`edges = $${paramIndex++}`)
      values.push(JSON.stringify(updates.edges))
    }
    if (updates.is_active !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`)
      values.push(updates.is_active)
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    setClauses.push('updated_at = NOW()')

    // Use a simpler approach for updates
    const result = await sql`
      UPDATE flows
      SET 
        name = COALESCE(${updates.name ?? null}, name),
        description = COALESCE(${updates.description ?? null}, description),
        nodes = COALESCE(${updates.nodes ? JSON.stringify(updates.nodes) : null}::jsonb, nodes),
        edges = COALESCE(${updates.edges ? JSON.stringify(updates.edges) : null}::jsonb, edges),
        is_active = COALESCE(${updates.is_active ?? null}, is_active),
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING id, name, description, nodes, edges, is_active, created_at, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    return NextResponse.json({ flow: result[0] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Error updating flow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const result = await sql`
      DELETE FROM flows
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting flow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
