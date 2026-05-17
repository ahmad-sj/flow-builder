"use client"

import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText, Upload, Search, Trash2, Loader2, ArrowLeft, Plus, BookOpen,
} from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function KnowledgeBasePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const { data: documents, mutate } = useSWR(
    status === "authenticated" ? "/api/knowledge" : null,
    fetcher
  )

  const [showUpload, setShowUpload] = useState(false)
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [uploading, setUploading] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ content: string; documentName: string; score: number }> | null>(null)
  const [searching, setSearching] = useState(false)

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return

    setUploading(true)
    try {
      await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content }),
      })
      setName("")
      setContent("")
      setShowUpload(false)
      mutate()
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setUploading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const res = await fetch("/api/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      })
      const results = await res.json()
      setSearchResults(results)
    } catch (err) {
      console.error("Search failed:", err)
    } finally {
      setSearching(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/knowledge/${id}`, { method: "DELETE" })
      mutate()
    } catch (err) {
      console.error("Delete failed:", err)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to dashboard</span>
              </Button>
            </Link>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">Knowledge Base</h1>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowUpload(!showUpload)}>
            <Plus className="h-4 w-4" />
            Add Document
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Upload form */}
        {showUpload && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4" />
                Add New Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label htmlFor="doc-name" className="mb-1.5 block text-sm font-medium text-foreground">
                    Document Name
                  </label>
                  <Input
                    id="doc-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., API Documentation"
                  />
                </div>
                <div>
                  <label htmlFor="doc-content" className="mb-1.5 block text-sm font-medium text-foreground">
                    Content
                  </label>
                  <Textarea
                    id="doc-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your document content here..."
                    rows={8}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={uploading || !name.trim() || !content.trim()}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "Processing..." : "Upload & Process"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your knowledge base..."
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={searching || !searchQuery.trim()}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </form>

            {searchResults && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-foreground">
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
                </p>
                {searchResults.map((result, i) => (
                  <div key={i} className="rounded-md border border-border bg-background p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-primary">{result.documentName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {(result.score * 100).toFixed(1)}% match
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{result.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents list */}
        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground">Documents</h2>
          {!documents ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No documents yet</p>
                <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
                  <Plus className="h-4 w-4" />
                  Add your first document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: { id: string; name: string; created_at: string; metadata: Record<string, unknown> }) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete document</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
