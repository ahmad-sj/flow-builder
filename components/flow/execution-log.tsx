"use client"

import { CheckCircle2, XCircle, Loader2, Clock, ChevronDown, ChevronUp, FileDown, ExternalLink } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export interface ExecutionStep {
  nodeId: string
  nodeName: string
  nodeType: string
  status: "pending" | "running" | "completed" | "error"
  output?: unknown
  error?: string
  startedAt?: string
  completedAt?: string
}

interface ExecutionLogProps {
  steps: ExecutionStep[]
  visible: boolean
  onToggle: () => void
}

const statusIcons = {
  pending: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
  running: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
  error: <XCircle className="h-3.5 w-3.5 text-red-500" />,
}

export function ExecutionLog({ steps, visible, onToggle }: ExecutionLogProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

const downloadedPdfs = useRef<Set<string>>(new Set())

  useEffect(() => {
    steps.forEach((step) => {
      if (step.status === "completed" && step.nodeType === "save_pdf" && step.output) {
        if (!downloadedPdfs.current.has(step.nodeId)) {
          downloadedPdfs.current.add(step.nodeId)
          handlePdfDownload(step)
        }
      }
    })
  }, [steps])

  const handlePdfDownload = async (step: ExecutionStep) => {
    const output = step.output as { filename?: string; data?: unknown }
    const filename = output?.filename || "output.pdf"
    const data = output?.data
    
    // Check if data is already HTML content (from llm_call webpage output)
    if (typeof data === "string" && data.trim().startsWith("<!DOCTYPE html") || data?.trim().startsWith("<html")) {
      // Directly open print window for HTML content
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(data)
        printWindow.document.close()
        // Trigger print after a brief delay to ensure content is rendered
        setTimeout(() => {
          try {
            printWindow.print()
          } catch (e) {
            // Print blocked - user can manually print
          }
        }, 500)
      }
      toast.info("Print dialog opened - save as PDF")
      return
    }
    
    // Safe stringify that handles circular references
    const safeStringify = (obj: unknown, indent = 2) => {
      const seen = new WeakSet()
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular]"
          }
          seen.add(value)
        }
        return value
      }, indent)
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .content { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow: auto; }
          </style>
        </head>
        <body>
          <div class="content">${safeStringify(data)}</div>
        </body>
      </html>
    `
    
    try {
      const res = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: htmlContent, filename }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        if (errorData?.html) {
          // API returned HTML for client-side PDF generation - open print dialog
          const printWindow = window.open("", "_blank")
          if (printWindow) {
            printWindow.document.write(errorData.html)
            printWindow.document.close()
            setTimeout(() => {
              try {
                printWindow.print()
              } catch (e) {
                // Print blocked - user can manually print
              }
            }, 500)
          }
          toast.info("Print dialog opened - save as PDF")
          return
        }
        throw new Error("PDF generation failed")
      }

      // Check if response is JSON (fallback mode) or PDF
      const contentType = res.headers.get("content-type") || ""
      if (contentType.includes("application/json")) {
        const errorData = await res.json()
        if (errorData?.html) {
          const printWindow = window.open("", "_blank")
          if (printWindow) {
            printWindow.document.write(errorData.html)
            printWindow.document.close()
            setTimeout(() => {
              try {
                printWindow.print()
              } catch (e) {
                // Print blocked - user can manually print
              }
            }, 500)
          }
          toast.info("Print dialog opened - save as PDF")
          return
        }
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`PDF downloaded: ${filename}`)
    } catch (error) {
      console.error("PDF download error:", error)
      toast.error("Failed to generate PDF. Please try again.")
    }
  }

  const toggleStep = (nodeId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  if (!visible) return null

  const renderOutput = (step: ExecutionStep) => {
    if (step.error) {
      return <pre className="text-[11px] text-red-500 whitespace-pre-wrap">{step.error}</pre>
    }
    if (step.output !== undefined) {
      const output = step.output as Record<string, unknown> | undefined
      
if (step.nodeType === "llm_call" && output?.outputFormat === "webpage") {
          const html = output?.html as string | undefined
          const text = output?.text as string | undefined
          return (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px]"
                  onClick={() => {
                    const printWindow = window.open("", "_blank")
                    if (printWindow) {
                      printWindow.document.write(html || "")
                      printWindow.document.close()
                      setTimeout(() => {
                        try {
                          printWindow.print()
                        } catch (e) {
                          // Print blocked
                        }
                      }, 500)
                    }
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Report
                </Button>
              </div>
              <pre className="max-h-32 overflow-auto text-[11px] text-muted-foreground whitespace-pre-wrap rounded bg-muted/50 p-2">
                {text || "Report generated"}
              </pre>
            </div>
          )
        }
      
      if (step.nodeType === "log") {
        const logged = output?.logged as string | undefined
        const prefix = output?.prefix as string | undefined
        return (
          <div className="space-y-2">
            {prefix && <p className="text-[11px] font-semibold">{prefix}</p>}
            <pre className="max-h-32 overflow-auto text-[11px] text-muted-foreground whitespace-pre-wrap rounded bg-muted/50 p-2">
              {logged || JSON.stringify(output, null, 2)}
            </pre>
          </div>
        )
      }
      
      if (step.nodeType === "color") {
        const logged = output?.logged as string | undefined
        const prefix = output?.prefix as string | undefined
        const color = output?.color as string | undefined
        return (
          <div className="space-y-2">
            {prefix && <p className="text-[11px] font-semibold">{prefix}</p>}
            <pre 
              className="max-h-32 overflow-auto text-[11px] whitespace-pre-wrap rounded bg-muted/50 p-2"
              style={color ? { color } : undefined}
            >
              {logged || JSON.stringify(output, null, 2)}
            </pre>
          </div>
        )
      }
      
      if (step.nodeType === "save_pdf") {
        const filename = output?.filename as string | undefined
        return (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground">PDF generated: {filename || "output.pdf"}</p>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px]"
              onClick={() => handlePdfDownload(step)}
            >
              <FileDown className="h-3 w-3 mr-1" />
              Download PDF
            </Button>
          </div>
        )
      }

      return (
        <pre className="max-h-32 overflow-auto text-[11px] text-muted-foreground whitespace-pre-wrap">
          {typeof step.output === "string" ? step.output : JSON.stringify(step.output, null, 2)}
        </pre>
      )
    }
    return <p className="text-[11px] text-muted-foreground">No output</p>
  }

  return (
    <div className="border-t border-border bg-card">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <span>Execution Log ({steps.length} steps)</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <div className="max-h-60 overflow-y-auto px-4 pb-3">
        {steps.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">No execution steps yet</p>
        ) : (
          <div className="space-y-1">
            {steps.map((step) => (
              <div key={step.nodeId} className="rounded-md border border-border bg-background">
                <button
                  onClick={() => toggleStep(step.nodeId)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left"
                >
                  {statusIcons[step.status]}
                  <span className="flex-1 text-xs font-medium text-foreground">{step.nodeName}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">{step.nodeType}</span>
                  {expandedSteps.has(step.nodeId) ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
                {expandedSteps.has(step.nodeId) && (
                  <div className="border-t border-border px-3 py-2">
                    {renderOutput(step)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}