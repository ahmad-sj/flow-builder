import { type Node, type Edge } from '@xyflow/react'

export type NodeType = 'trigger' | 'http_request' | 'code_runner' | 'condition' | 'llm_call' | 'webhook' | 'log' | 'color' | 'save_pdf'

export interface BaseNodeData {
  label: string
  description?: string
  isExecuting?: boolean
  hasError?: boolean
  [key: string]: unknown
}

export interface TriggerNodeData extends BaseNodeData {
  triggerType: 'manual' | 'schedule' | 'webhook'
  schedule?: string
  webhookPath?: string
}

export interface HttpRequestNodeData extends BaseNodeData {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers?: Record<string, string>
  body?: string
}

export interface CodeRunnerNodeData extends BaseNodeData {
  code: string
  language: 'javascript' | 'python'
}

export interface ConditionNodeData extends BaseNodeData {
  condition: string
  trueLabel?: string
  falseLabel?: string
}

export interface LLMCallNodeData extends BaseNodeData {
  model: string
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export interface WebhookNodeData extends BaseNodeData {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  responseType: 'json' | 'text'
}

export interface LogNodeData extends BaseNodeData {
  prefix?: string
}

export interface ColorNodeData extends BaseNodeData {
  prefix?: string
}

export interface SavePdfNodeData extends BaseNodeData {
  filename?: string
  format?: 'A4' | 'Letter' | 'Legal'
}

export type FlowNodeData = 
  | TriggerNodeData 
  | HttpRequestNodeData 
  | CodeRunnerNodeData 
  | ConditionNodeData 
  | LLMCallNodeData 
  | WebhookNodeData
  | LogNodeData
  | ColorNodeData
  | SavePdfNodeData

export type FlowNode = Node<FlowNodeData, NodeType>
export type FlowEdge = Edge

export interface FlowState {
  id: string
  name: string
  description?: string
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export const NODE_TYPE_COLORS: Record<NodeType, { bg: string; border: string; icon: string }> = {
  trigger: { bg: 'bg-emerald-50', border: 'border-emerald-500', icon: 'text-emerald-600' },
  http_request: { bg: 'bg-blue-50', border: 'border-blue-500', icon: 'text-blue-600' },
  code_runner: { bg: 'bg-amber-50', border: 'border-amber-500', icon: 'text-amber-600' },
  condition: { bg: 'bg-purple-50', border: 'border-purple-500', icon: 'text-purple-600' },
  llm_call: { bg: 'bg-pink-50', border: 'border-pink-500', icon: 'text-pink-600' },
  webhook: { bg: 'bg-cyan-50', border: 'border-cyan-500', icon: 'text-cyan-600' },
  log: { bg: 'bg-indigo-50', border: 'border-indigo-500', icon: 'text-indigo-600' },
  color: { bg: 'bg-rose-50', border: 'border-rose-500', icon: 'text-rose-600' },
  save_pdf: { bg: 'bg-green-50', border: 'border-green-500', icon: 'text-green-600' },
}

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  trigger: 'Trigger',
  http_request: 'HTTP Request',
  code_runner: 'Code Runner',
  condition: 'Condition',
  llm_call: 'LLM Call',
  webhook: 'Webhook',
  log: 'Log',
  color: 'Color',
  save_pdf: 'Save PDF',
}

export const DEFAULT_NODE_DATA: Record<NodeType, Partial<FlowNodeData>> = {
  trigger: {
    label: 'Trigger',
    triggerType: 'manual',
  } as TriggerNodeData,
  http_request: {
    label: 'HTTP Request',
    method: 'GET',
    url: '',
  } as HttpRequestNodeData,
  code_runner: {
    label: 'Code Runner',
    code: '// Your code here\nreturn input;',
    language: 'javascript',
  } as CodeRunnerNodeData,
  condition: {
    label: 'Condition',
    condition: '',
    trueLabel: 'True',
    falseLabel: 'False',
  } as ConditionNodeData,
  llm_call: {
    label: 'LLM Call',
    model: 'deepseek-v4-flash',
    prompt: '',
    temperature: 0.7,
  } as LLMCallNodeData,
  webhook: {
    label: 'Webhook',
    method: 'POST',
    path: '/webhook',
    responseType: 'json',
  } as WebhookNodeData,
  log: {
    label: 'Log',
    prefix: '',
  } as LogNodeData,
  color: {
    label: 'Color',
    prefix: '',
  } as ColorNodeData,
  save_pdf: {
    label: 'Save PDF',
    filename: 'output.pdf',
    format: 'A4',
  } as SavePdfNodeData,
}
