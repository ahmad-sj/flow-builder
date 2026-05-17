"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Save, ArrowLeft, Download, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Node, Edge } from "@xyflow/react"

interface FlowToolbarProps {
  flowName: string
  onSave: () => void
  onRun: () => void
  saving: boolean
  running: boolean
  nodes: Node[]
  edges: Edge[]
}

export function FlowToolbar({ flowName, onSave, onRun, saving, running, nodes, edges }: FlowToolbarProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = () => {
    setExporting(true)
    try {
      const exportData = {
        name: flowName,
        nodes,
        edges,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${flowName.replace(/[^a-zA-Z0-9]/g, '_')}.flow.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to dashboard</span>
          </Button>
        </Link>
        <div className="h-5 w-px bg-border" />
        <h1 className="text-sm font-semibold text-foreground">{flowName}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" onClick={onRun} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? "Running..." : "Run Flow"}
        </Button>
      </div>
    </div>
  )
}
