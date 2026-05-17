import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Workflow, Zap, Bot, Code2, Globe, GitBranch,
  ArrowRight, Sparkles, BookOpen,
} from "lucide-react"

const features = [
  {
    icon: Workflow,
    title: "Visual Flow Builder",
    description: "Drag and drop nodes to build complex automations. Connect triggers, API calls, code blocks, and AI in a visual canvas.",
  },
  {
    icon: Bot,
    title: "AI-Powered Assistant",
    description: "Describe what you want in natural language. Our AI agent builds and modifies flows using tool-calling capabilities.",
  },
  {
    icon: Code2,
    title: "Code Runner Nodes",
    description: "Execute custom JavaScript logic within your flows. Access outputs from previous nodes and transform data freely.",
  },
  {
    icon: Globe,
    title: "HTTP & Webhooks",
    description: "Make API requests, receive webhooks, and integrate with any external service through configurable HTTP nodes.",
  },
  {
    icon: GitBranch,
    title: "Conditional Logic",
    description: "Branch your workflows with condition nodes. Route data through different paths based on dynamic expressions.",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base RAG",
    description: "Upload documents and let the AI search your knowledge base with semantic vector search for context-aware responses.",
  },
]

const nodeTypes = [
  { name: "Trigger", color: "bg-emerald-500/15 text-emerald-600", icon: Zap },
  { name: "HTTP Request", color: "bg-blue-500/15 text-blue-600", icon: Globe },
  { name: "Code Runner", color: "bg-amber-500/15 text-amber-600", icon: Code2 },
  { name: "Condition", color: "bg-orange-500/15 text-orange-600", icon: GitBranch },
  { name: "LLM Call", color: "bg-primary/15 text-primary", icon: Sparkles },
  { name: "Webhook", color: "bg-rose-500/15 text-rose-600", icon: Globe },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Workflow className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">FlowBuilder AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Powered by AI with tool-calling
          </div>
          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Build Automations with{" "}
            <span className="text-primary">Visual Flows</span> and{" "}
            <span className="text-accent">AI</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Drag, drop, and connect nodes to create powerful workflows. Or just tell the AI what you need
            and watch it build the flow for you.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Start Building
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Node types showcase */}
      <section className="border-y border-border bg-card/50 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            6 Node Types
          </h2>
          <p className="mb-10 text-center text-2xl font-bold text-foreground">
            Everything you need to automate
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {nodeTypes.map((type) => (
              <div
                key={type.name}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${type.color}`}
              >
                <type.icon className="h-4 w-4" />
                {type.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Features
          </h2>
          <p className="mb-12 text-center text-2xl font-bold text-foreground">
            A complete workflow platform
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold text-foreground">
            Ready to automate your workflows?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start building with the visual editor or let the AI create flows for you.
          </p>
          <Link href="/register">
            <Button size="lg" className="mt-8 px-10">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">FlowBuilder AI</span>
          </div>
          <p className="text-xs text-muted-foreground">Built with Next.js, React Flow, and AI SDK</p>
        </div>
      </footer>
    </div>
  )
}
