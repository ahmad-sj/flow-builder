import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL!)

export type User = {
  id: string
  email: string
  password_hash: string
  name: string | null
  created_at: Date
  updated_at: Date
}

export type Flow = {
  id: string
  user_id: string
  name: string
  description: string | null
  nodes: FlowNode[]
  edges: FlowEdge[]
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export type FlowNode = {
  id: string
  type: 'trigger' | 'http_request' | 'code_runner' | 'condition' | 'llm_call' | 'webhook'
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export type FlowEdge = {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export type FlowRun = {
  id: string
  flow_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  trigger_type: string | null
  input: Record<string, unknown> | null
  output: Record<string, unknown> | null
  error: string | null
  started_at: Date
  completed_at: Date | null
}

export type KnowledgeDocument = {
  id: string
  user_id: string
  name: string
  content: string
  metadata: Record<string, unknown>
  created_at: Date
}

export type DocumentChunk = {
  id: string
  document_id: string
  content: string
  embedding: number[]
  chunk_index: number
  created_at: Date
}
