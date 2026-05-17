import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { html, filename } = await request.json()

    const response = await fetch("https://api.html2pdf.app/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html: html || `<html><body><h1>PDF Document</h1><pre>${JSON.stringify({}, null, 2)}</pre></body></html>`,
        margin: "0.5in",
        displayHeaderFooter: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      console.error("html2pdf API error:", response.status, errorText)
      // Fallback: return HTML for client-side PDF generation
      return NextResponse.json({ 
        html: html,
        filename: filename || "output.pdf",
        message: "Open in browser to save as PDF"
      })
    }

    const pdfBuffer = await response.arrayBuffer()

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename || "output.pdf"}"`,
      },
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    // Fallback: return HTML for client-side PDF generation
    return NextResponse.json({ 
      html: "<html><body><h1>PDF Generation Error</h1></body></html>",
      filename: "output.pdf",
      message: "Open in browser to save as PDF"
    })
  }
}