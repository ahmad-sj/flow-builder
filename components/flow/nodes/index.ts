import TriggerNode from './trigger-node'
import HttpRequestNode from './http-request-node'
import CodeRunnerNode from './code-runner-node'
import ConditionNode from './condition-node'
import LLMCallNode from './llm-call-node'
import WebhookNode from './webhook-node'
import LogNode from './log-node'
import ColorNode from './color-node'
import SavePdfNode from './save-pdf-node'

export const nodeTypes = {
  trigger: TriggerNode,
  http_request: HttpRequestNode,
  code_runner: CodeRunnerNode,
  condition: ConditionNode,
  llm_call: LLMCallNode,
  webhook: WebhookNode,
  log: LogNode,
  color: ColorNode,
  save_pdf: SavePdfNode,
}

export {
  TriggerNode,
  HttpRequestNode,
  CodeRunnerNode,
  ConditionNode,
  LLMCallNode,
  WebhookNode,
  LogNode,
  ColorNode,
  SavePdfNode,
}
