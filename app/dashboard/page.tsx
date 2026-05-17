'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Zap,
  Plus,
  Search,
  MoreHorizontal,
  Play,
  Pencil,
  Trash2,
  User,
  LogOut,
  Loader2,
  Workflow,
  Clock,
  Upload,
  Download,
  LayoutTemplate,
} from 'lucide-react'
import type { Flow } from '@/lib/db'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exportingId, setExportingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, error, mutate } = useSWR<{ flows: Flow[] }>(
    status === 'authenticated' ? '/api/flows' : null,
    fetcher
  )

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const handleCreateFlow = async () => {
    setCreating(true)
    try {
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Untitled Flow' }),
      })
      const data = await response.json()
      if (data.flow) {
        router.push(`/flow/${data.flow.id}`)
      }
    } catch (error) {
      console.error('Error creating flow:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteFlow = async (id: string) => {
    try {
      await fetch(`/api/flows/${id}`, { method: 'DELETE' })
      mutate()
    } catch (error) {
      console.error('Error deleting flow:', error)
    }
  }

  const handleExportFlow = async (flow: Flow) => {
    setExportingId(flow.id)
    try {
      const exportData = {
        name: flow.name,
        description: flow.description || '',
        nodes: typeof flow.nodes === 'string' ? JSON.parse(flow.nodes) : flow.nodes,
        edges: typeof flow.edges === 'string' ? JSON.parse(flow.edges) : flow.edges,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${flow.name.replace(/[^a-zA-Z0-9]/g, '_')}.flow.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export flow:', err)
    } finally {
      setExportingId(null)
    }
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.nodes || !data.edges) {
        throw new Error('Invalid flow file: missing nodes or edges')
      }

      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name || 'Imported Flow',
          description: data.description || '',
          nodes: data.nodes,
          edges: data.edges,
        }),
      })
      const result = await res.json()

      if (result.flow) {
        toast.success(`"${result.flow.name}" imported successfully.`)
        router.push(`/flow/${result.flow.id}`)
      } else {
        throw new Error(result.error || 'Failed to import flow')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid flow file')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const filteredFlows = data?.flows?.filter((flow) =>
    flow.name.toLowerCase().includes(search.toLowerCase())
  )

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">FlowBuilder AI</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
            <Button
              variant="ghost"
              size="sm"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              {importing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Import
            </Button>
            <Link href="/templates">
              <Button variant="ghost" size="sm">
                <LayoutTemplate className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{session.user?.name || 'User'}</p>
                  <p className="text-muted-foreground">{session.user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          {/* Title and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Workflows</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage your automation workflows
              </p>
            </div>
            <Button onClick={handleCreateFlow} disabled={creating}>
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              New Workflow
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Flows Grid */}
          {error ? (
            <div className="text-center py-12 text-destructive">
              Failed to load workflows
            </div>
          ) : !data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredFlows?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first workflow to get started with automation
                </p>
                <Button onClick={handleCreateFlow} disabled={creating}>
                  {creating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFlows?.map((flow) => (
                <Card key={flow.id} className="group hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{flow.name}</CardTitle>
                        <CardDescription className="truncate">
                          {flow.description || 'No description'}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/flow/${flow.id}`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleExportFlow(flow)}
                            disabled={exportingId === flow.id}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export JSON
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/flow/${flow.id}`}>
                              <Play className="h-4 w-4 mr-2" />
                              Run
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteFlow(flow.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Workflow className="h-4 w-4" />
                        {Array.isArray(flow.nodes) ? flow.nodes.length : 0} nodes
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(flow.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link href={`/flow/${flow.id}`}>
                        <Button variant="secondary" size="sm" className="w-full">
                          Open Editor
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
