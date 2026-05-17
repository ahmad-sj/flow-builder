"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Search,
  Brain,
  Globe,
  Bell,
  Code,
  Briefcase,
  Workflow,
  Plus,
  Loader2,
  Zap,
  User,
  LogOut,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "next-auth/react"
import type { FlowTemplate, TemplateCategory } from "@/lib/templates"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CATEGORY_ICON_MAP: Record<TemplateCategory, React.ReactNode> = {
  "ai-llm": <Brain className="h-4 w-4" />,
  "api-data": <Globe className="h-4 w-4" />,
  "notifications": <Bell className="h-4 w-4" />,
  "developer-tools": <Code className="h-4 w-4" />,
  "business-automation": <Briefcase className="h-4 w-4" />,
}

export default function TemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [creating, setCreating] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const params = new URLSearchParams()
  if (selectedCategory !== "all") params.set("category", selectedCategory)
  if (search) params.set("search", search)

  const { data, error } = useSWR<{
    templates: FlowTemplate[]
    categories: { value: string; label: string }[]
  }>(status === "authenticated" ? `/api/templates?${params.toString()}` : null, fetcher)

  const handleUseTemplate = async (template: FlowTemplate) => {
    setCreating(template.id)
    try {
      const res = await fetch("/api/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          nodes: template.nodes,
          edges: template.edges,
        }),
      })
      const data = await res.json()
      if (data.flow) {
        router.push(`/flow/${data.flow.id}`)
      }
    } catch (err) {
      console.error("Failed to create flow from template:", err)
    } finally {
      setCreating(null)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-5 w-px bg-border" />
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">FlowBuilder AI</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <Workflow className="h-4 w-4 mr-2" />
                My Workflows
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
                  <p className="font-medium">{session.user?.name || "User"}</p>
                  <p className="text-muted-foreground">{session.user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
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
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Flow Templates</h1>
          <p className="text-muted-foreground mt-1">
            Start with a pre-built template and customize it for your needs
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 px-3 py-1.5"
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Badge>
            {data?.categories?.map((cat) => (
              <Badge
                key={cat.value}
                variant={selectedCategory === cat.value ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80 px-3 py-1.5 gap-1.5"
                onClick={() => setSelectedCategory(cat.value)}
              >
                {CATEGORY_ICON_MAP[cat.value as TemplateCategory]}
                {cat.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        {error ? (
          <div className="text-center py-12 text-destructive">Failed to load templates</div>
        ) : !data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data.templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground text-center">
                Try adjusting your search or category filter
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.templates.map((template) => (
              <Card
                key={template.id}
                className="group hover:border-primary/50 transition-colors flex flex-col"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-2 mb-1">
                    {CATEGORY_ICON_MAP[template.category]}
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Workflow className="h-4 w-4" />
                    {template.nodes.length} nodes
                    <span className="mx-1">·</span>
                    {template.edges.length} connections
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleUseTemplate(template)}
                    disabled={creating === template.id}
                  >
                    {creating === template.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
