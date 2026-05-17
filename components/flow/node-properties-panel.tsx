'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type FlowNode, type NodeType } from '@/lib/flow-types'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NodePropertiesPanelProps {
  node: FlowNode | null
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void
  onClose: () => void
}

export function NodePropertiesPanel({ node, onUpdate, onClose }: NodePropertiesPanelProps) {
  if (!node) return null

  const handleChange = (key: string, value: unknown) => {
    onUpdate(node.id, { ...node.data, [key]: value })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Node Properties</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={(node.data.label as string) || ''}
            onChange={(e) => handleChange('label', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={(node.data.description as string) || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={2}
          />
        </div>

        {renderNodeSpecificFields(node, handleChange)}
      </div>
    </div>
  )
}

function renderNodeSpecificFields(
  node: FlowNode,
  handleChange: (key: string, value: unknown) => void
) {
  const nodeType = node.type as NodeType

  switch (nodeType) {
    case 'trigger':
      return (
        <div className="space-y-2">
          <Label htmlFor="triggerType">Trigger Type</Label>
          <Select
            value={(node.data.triggerType as string) || 'manual'}
            onValueChange={(value) => handleChange('triggerType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="schedule">Schedule</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
            </SelectContent>
          </Select>
          {node.data.triggerType === 'schedule' && (
            <div className="space-y-2 mt-2">
              <Label htmlFor="schedule">Cron Expression</Label>
              <Input
                id="schedule"
                value={(node.data.schedule as string) || ''}
                onChange={(e) => handleChange('schedule', e.target.value)}
                placeholder="0 * * * *"
              />
            </div>
          )}
        </div>
      )

    case 'http_request':
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="method">Method</Label>
            <Select
              value={(node.data.method as string) || 'GET'}
              onValueChange={(value) => handleChange('method', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={(node.data.url as string) || ''}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://api.example.com/endpoint"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Request Body (JSON)</Label>
            <Textarea
              id="body"
              value={(node.data.body as string) || ''}
              onChange={(e) => handleChange('body', e.target.value)}
              rows={4}
              className="font-mono text-sm"
              placeholder='{"key": "value"}'
            />
          </div>
        </>
      )

    case 'code_runner':
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={(node.data.language as string) || 'javascript'}
              onValueChange={(value) => handleChange('language', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Textarea
              id="code"
              value={(node.data.code as string) || ''}
              onChange={(e) => handleChange('code', e.target.value)}
              rows={8}
              className="font-mono text-sm"
              placeholder="// Your code here"
            />
          </div>
        </>
      )

    case 'condition':
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="condition">Condition Expression</Label>
            <Textarea
              id="condition"
              value={(node.data.condition as string) || ''}
              onChange={(e) => handleChange('condition', e.target.value)}
              rows={3}
              className="font-mono text-sm"
              placeholder="input.value > 10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="trueLabel">True Label</Label>
              <Input
                id="trueLabel"
                value={(node.data.trueLabel as string) || 'True'}
                onChange={(e) => handleChange('trueLabel', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="falseLabel">False Label</Label>
              <Input
                id="falseLabel"
                value={(node.data.falseLabel as string) || 'False'}
                onChange={(e) => handleChange('falseLabel', e.target.value)}
              />
            </div>
          </div>
        </>
      )

    case 'llm_call':
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select
              value={(node.data.model as string) || 'deepseek-v4-flash'}
              onValueChange={(value) => handleChange('model', value)}
            >
              <SelectTrigger>
                <SelectValue defaultValue={'deepseek-v4-flash'}/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deepseek-v4-flash">DeepSeek Flash</SelectItem>                
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="outputFormat">Output Format</Label>
            <Select
              value={(node.data.outputFormat as string) || 'text'}
              onValueChange={(value) => handleChange('outputFormat', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Plain Text</SelectItem>
                <SelectItem value="webpage">HTML Web Page (Clean Report)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              value={(node.data.systemPrompt as string) || ''}
              onChange={(e) => handleChange('systemPrompt', e.target.value)}
              rows={3}
              placeholder="You are a helpful assistant..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt Template</Label>
            <Textarea
              id="prompt"
              value={(node.data.prompt as string) || ''}
              onChange={(e) => handleChange('prompt', e.target.value)}
              rows={4}
              placeholder="Analyze the following: {{input}}"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={(node.data.temperature as number) || 0.7}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min={1}
                max={4096}
                value={(node.data.maxTokens as number) || 1024}
                onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
              />
            </div>
          </div>
        </>
      )

case 'webhook':
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="webhookMethod">Method</Label>
            <Select
              value={(node.data.method as string) || 'POST'}
              onValueChange={(value) => handleChange('method', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="path">Webhook Path</Label>
            <Input
              id="path"
              value={(node.data.path as string) || ''}
              onChange={(e) => handleChange('path', e.target.value)}
              placeholder="/webhook/my-endpoint"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responseType">Response Type</Label>
            <Select
              value={(node.data.responseType as string) || 'json'}
              onValueChange={(value) => handleChange('responseType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )

case 'log':
      return (
        <div className="space-y-2">
          <Label htmlFor="prefix">Prefix (optional)</Label>
          <Input
            id="prefix"
            value={(node.data.prefix as string) || ''}
            onChange={(e) => handleChange('prefix', e.target.value)}
            placeholder="Log prefix..."
          />
        </div>
      )

    case 'color':
      return (
        <div className="space-y-2">
          <Label htmlFor="prefix">Prefix (optional)</Label>
          <Input
            id="prefix"
            value={(node.data.prefix as string) || ''}
            onChange={(e) => handleChange('prefix', e.target.value)}
            placeholder="Color output prefix..."
          />
        </div>
      )

    case 'save_pdf':
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={(node.data.filename as string) || 'output.pdf'}
              onChange={(e) => handleChange('filename', e.target.value)}
              placeholder="output.pdf"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="format">Page Format</Label>
            <Select
              value={(node.data.format as string) || 'A4'}
              onValueChange={(value) => handleChange('format', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )

    default:
      return null
  }
}
