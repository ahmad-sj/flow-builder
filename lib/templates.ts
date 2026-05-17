export interface FlowTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  icon: string
  nodes: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    data: Record<string, unknown>
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    sourceHandle?: string
    animated?: boolean
  }>
}

export type TemplateCategory =
  | "ai-llm"
  | "api-data"
  | "notifications"
  | "developer-tools"
  | "business-automation"

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  "ai-llm": "AI & LLM",
  "api-data": "API & Data",
  "notifications": "Notifications",
  "developer-tools": "Developer Tools",
  "business-automation": "Business Automation",
}

export const CATEGORY_ICONS: Record<TemplateCategory, string> = {
  "ai-llm": "brain",
  "api-data": "globe",
  "notifications": "bell",
  "developer-tools": "code",
  "business-automation": "briefcase",
}

export const TEMPLATES: FlowTemplate[] = [
  // ─── AI & LLM ───────────────────────────────────────────
  {
    id: "ai-content-summarizer",
    name: "AI Content Summarizer",
    description: "Fetch content from any URL, summarize it with an LLM, and post the result to a webhook.",
    category: "ai-llm",
    icon: "brain",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Manual Trigger", triggerType: "manual" } },
      { id: "http", type: "http_request", position: { x: 350, y: 200 }, data: { label: "Fetch Content", method: "GET", url: "https://example.com/article" } },
      { id: "llm", type: "llm_call", position: { x: 600, y: 200 }, data: { label: "Summarize", model: "deepseek-v4-flash", prompt: "Summarize the following content in 3 bullet points:\n\n{{http.output}}", temperature: 0.5 } },
      { id: "webhook", type: "webhook", position: { x: 850, y: 200 }, data: { label: "Post Result", webhookUrl: "https://hooks.example.com/summaries", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "http", animated: true },
      { id: "e2", source: "http", target: "llm", animated: true },
      { id: "e3", source: "llm", target: "webhook", animated: true },
    ],
  },
  {
    id: "sentiment-analysis",
    name: "Sentiment Analysis Pipeline",
    description: "Analyze user feedback text sentiment and route positive/negative to different endpoints.",
    category: "ai-llm",
    icon: "brain",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Webhook Trigger", triggerType: "webhook" } },
      { id: "llm", type: "llm_call", position: { x: 350, y: 200 }, data: { label: "Analyze Sentiment", model: "deepseek-v4-flash", prompt: "Analyze the sentiment of this text. Reply with only one word: 'positive', 'negative', or 'neutral'.\n\nText: {{trigger.output}}", temperature: 0.1 } },
      { id: "condition", type: "condition", position: { x: 600, y: 200 }, data: { label: "Is Positive?", condition: "outputs['llm']?.text?.toLowerCase().includes('positive')" } },
      { id: "webhook_positive", type: "webhook", position: { x: 850, y: 100 }, data: { label: "Positive → Slack", webhookUrl: "https://hooks.slack.com/services/...", webhookMethod: "POST" } },
      { id: "webhook_negative", type: "webhook", position: { x: 850, y: 300 }, data: { label: "Negative → Escalate", webhookUrl: "https://api.example.com/escalate", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "llm", animated: true },
      { id: "e2", source: "llm", target: "condition", animated: true },
      { id: "e3", source: "condition", target: "webhook_positive", sourceHandle: "true", animated: true },
      { id: "e4", source: "condition", target: "webhook_negative", sourceHandle: "false", animated: true },
    ],
  },
  {
    id: "multi-step-llm-workflow",
    name: "Multi-Step LLM Workflow",
    description: "Chain two LLM calls: first research a topic, then critique the result.",
    category: "ai-llm",
    icon: "brain",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Manual Trigger", triggerType: "manual" } },
      { id: "llm_research", type: "llm_call", position: { x: 350, y: 200 }, data: { label: "Research Topic", model: "deepseek-v4-flash", prompt: "Write a short research summary about: {{trigger.output}}", temperature: 0.7 } },
      { id: "llm_critique", type: "llm_call", position: { x: 600, y: 200 }, data: { label: "Critique Research", model: "deepseek-v4-flash", prompt: "Critique the following research summary. Point out gaps, biases, and suggest improvements:\n\n{{llm_research.output}}", temperature: 0.7 } },
      { id: "webhook", type: "webhook", position: { x: 850, y: 200 }, data: { label: "Save Result", webhookUrl: "https://api.example.com/research", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "llm_research", animated: true },
      { id: "e2", source: "llm_research", target: "llm_critique", animated: true },
      { id: "e3", source: "llm_critique", target: "webhook", animated: true },
    ],
  },
  {
    id: "rag-knowledge-qa",
    name: "RAG Knowledge Q&A",
    description: "Search your knowledge base before answering with an LLM for grounded responses.",
    category: "ai-llm",
    icon: "brain",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Question Received", triggerType: "webhook" } },
      { id: "http_search", type: "http_request", position: { x: 350, y: 200 }, data: { label: "Search Knowledge Base", method: "POST", url: "http://localhost:3000/api/knowledge/search", headers: '{"Content-Type":"application/json"}', body: '{"query":"{{trigger.output}}"}' } },
      { id: "llm", type: "llm_call", position: { x: 600, y: 200 }, data: { label: "Generate Answer", model: "deepseek-v4-flash", prompt: "Answer the question using the context below.\n\nContext: {{http_search.output}}\n\nQuestion: {{trigger.output}}", temperature: 0.3 } },
      { id: "webhook", type: "webhook", position: { x: 850, y: 200 }, data: { label: "Return Answer", webhookUrl: "https://api.example.com/answers", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "http_search", animated: true },
      { id: "e2", source: "http_search", target: "llm", animated: true },
      { id: "e3", source: "llm", target: "webhook", animated: true },
    ],
  },

  // ─── API & Data ─────────────────────────────────────────
  {
    id: "api-health-monitor",
    name: "API Health Monitor",
    description: "Ping an API endpoint on a schedule and alert if it's down or slow.",
    category: "api-data",
    icon: "globe",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Every 5 Minutes", triggerType: "schedule", schedule: "*/5 * * * *" } },
      { id: "http", type: "http_request", position: { x: 350, y: 200 }, data: { label: "Check API", method: "GET", url: "https://api.example.com/health" } },
      { id: "condition", type: "condition", position: { x: 600, y: 200 }, data: { label: "Status != 200?", condition: "outputs['http']?.status !== 200" } },
      { id: "webhook", type: "webhook", position: { x: 850, y: 200 }, data: { label: "Alert via Slack", webhookUrl: "https://hooks.slack.com/services/...", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "http", animated: true },
      { id: "e2", source: "http", target: "condition", animated: true },
      { id: "e3", source: "condition", target: "webhook", sourceHandle: "true", animated: true },
    ],
  },
  {
    id: "data-transformation-pipeline",
    name: "Data Transformation Pipeline",
    description: "Fetch data from two APIs, merge and transform with code, then send to a webhook.",
    category: "api-data",
    icon: "globe",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Manual Trigger", triggerType: "manual" } },
      { id: "http_users", type: "http_request", position: { x: 350, y: 100 }, data: { label: "Fetch Users", method: "GET", url: "https://jsonplaceholder.typicode.com/users" } },
      { id: "http_posts", type: "http_request", position: { x: 350, y: 300 }, data: { label: "Fetch Posts", method: "GET", url: "https://jsonplaceholder.typicode.com/posts" } },
      { id: "code", type: "code_runner", position: { x: 600, y: 200 }, data: { label: "Merge Data", code: "// Merge users with their posts\nconst users = outputs['http_users']?.body || [];\nconst posts = outputs['http_posts']?.body || [];\n\nconst merged = users.map(user => ({\n  ...user,\n  posts: posts.filter(p => p.userId === user.id)\n}));\n\nreturn { users: merged, totalUsers: users.length, totalPosts: posts.length };" } },
      { id: "webhook", type: "webhook", position: { x: 850, y: 200 }, data: { label: "Send Result", webhookUrl: "https://api.example.com/merged-data", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "http_users", animated: true },
      { id: "e2", source: "trigger", target: "http_posts", animated: true },
      { id: "e3", source: "http_users", target: "code", animated: true },
      { id: "e4", source: "http_posts", target: "code", animated: true },
      { id: "e5", source: "code", target: "webhook", animated: true },
    ],
  },
  {
    id: "weather-alert-system",
    name: "Weather Alert System",
    description: "Check weather hourly and send an LLM-written summary if conditions are severe.",
    category: "api-data",
    icon: "globe",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Hourly", triggerType: "schedule", schedule: "0 * * * *" } },
      { id: "http", type: "http_request", position: { x: 350, y: 200 }, data: { label: "Fetch Weather", method: "GET", url: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true" } },
      { id: "condition", type: "condition", position: { x: 600, y: 200 }, data: { label: "Temp > 35°C?", condition: "outputs['http']?.body?.current_weather?.temperature > 35" } },
      { id: "llm", type: "llm_call", position: { x: 850, y: 200 }, data: { label: "Write Alert", model: "deepseek-v4-flash", prompt: "Write a brief severe weather alert for the public:\n\nWeather data: {{http.output}}", temperature: 0.7 } },
      { id: "webhook", type: "webhook", position: { x: 1100, y: 200 }, data: { label: "Send Alert", webhookUrl: "https://hooks.example.com/alerts", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "http", animated: true },
      { id: "e2", source: "http", target: "condition", animated: true },
      { id: "e3", source: "condition", target: "llm", sourceHandle: "true", animated: true },
      { id: "e4", source: "llm", target: "webhook", animated: true },
    ],
  },
  {
    id: "multi-source-aggregator",
    name: "Multi-Source Data Aggregator",
    description: "Fetch from multiple APIs, transform with code, and store the result via webhook.",
    category: "api-data",
    icon: "globe",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Daily", triggerType: "schedule", schedule: "0 8 * * *" } },
      { id: "http_gh", type: "http_request", position: { x: 350, y: 100 }, data: { label: "GitHub Stars", method: "GET", url: "https://api.github.com/repos/facebook/react" } },
      { id: "http_npm", type: "http_request", position: { x: 350, y: 300 }, data: { label: "NPM Downloads", method: "GET", url: "https://api.npmjs.org/downloads/point/last-week/react" } },
      { id: "code", type: "code_runner", position: { x: 600, y: 200 }, data: { label: "Aggregate Metrics", code: "const github = outputs['http_gh']?.body;\nconst npm = outputs['http_npm']?.body;\n\nreturn {\n  repo: 'facebook/react',\n  stars: github?.stargazers_count,\n  forks: github?.forks_count,\n  downloadsLastWeek: npm?.downloads,\n  timestamp: new Date().toISOString()\n};" } },
      { id: "webhook", type: "webhook", position: { x: 850, y: 200 }, data: { label: "Save Metrics", webhookUrl: "https://api.example.com/metrics", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "http_gh", animated: true },
      { id: "e2", source: "trigger", target: "http_npm", animated: true },
      { id: "e3", source: "http_gh", target: "code", animated: true },
      { id: "e4", source: "http_npm", target: "code", animated: true },
      { id: "e5", source: "code", target: "webhook", animated: true },
    ],
  },

  // ─── Notifications ──────────────────────────────────────
  {
    id: "slack-notification-bot",
    name: "Slack Notification Bot",
    description: "Receive an event via webhook, optionally filter with a condition, and notify Slack.",
    category: "notifications",
    icon: "bell",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Event Trigger", triggerType: "webhook" } },
      { id: "condition", type: "condition", position: { x: 350, y: 200 }, data: { label: "Priority High?", condition: "outputs['trigger']?.priority === 'high'" } },
      { id: "webhook", type: "webhook", position: { x: 600, y: 200 }, data: { label: "Post to Slack", webhookUrl: "https://hooks.slack.com/services/...", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "condition", animated: true },
      { id: "e2", source: "condition", target: "webhook", sourceHandle: "true", animated: true },
    ],
  },
  {
    id: "email-digest-builder",
    name: "Email Digest Builder",
    description: "Fetch content from an API, summarize with LLM, and send to an email service webhook.",
    category: "notifications",
    icon: "bell",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Morning Digest", triggerType: "schedule", schedule: "0 7 * * *" } },
      { id: "http", type: "http_request", position: { x: 350, y: 200 }, data: { label: "Fetch News", method: "GET", url: "https://newsapi.org/v2/top-headlines?country=us&apiKey=YOUR_KEY" } },
      { id: "llm", type: "llm_call", position: { x: 600, y: 200 }, data: { label: "Summarize Top 5", model: "deepseek-v4-flash", prompt: "Summarize the top 5 headlines from this news data into a morning digest email. Keep it concise and friendly.\n\nNews: {{http.output}}", temperature: 0.7 } },
      { id: "webhook", type: "webhook", position: { x: 850, y: 200 }, data: { label: "Send Email", webhookUrl: "https://api.resend.com/emails", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "http", animated: true },
      { id: "e2", source: "http", target: "llm", animated: true },
      { id: "e3", source: "llm", target: "webhook", animated: true },
    ],
  },
  {
    id: "competitor-price-monitor",
    name: "Competitor Price Monitor",
    description: "Scrape competitor pricing daily, compare to your prices, and alert on price drops.",
    category: "notifications",
    icon: "bell",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Daily", triggerType: "schedule", schedule: "0 9 * * *" } },
      { id: "http", type: "http_request", position: { x: 350, y: 200 }, data: { label: "Fetch Competitor Prices", method: "GET", url: "https://api.example.com/competitor-prices" } },
      { id: "code", type: "code_runner", position: { x: 600, y: 200 }, data: { label: "Compare Prices", code: "const competitorPrices = outputs['http']?.body?.prices || {};\nconst myPrices = { product_a: 99, product_b: 149, product_c: 199 };\n\nconst alerts = [];\nfor (const [product, myPrice] of Object.entries(myPrices)) {\n  const competitorPrice = competitorPrices[product];\n  if (competitorPrice && competitorPrice < myPrice * 0.9) {\n    alerts.push({ product, myPrice, competitorPrice, drop: ((myPrice - competitorPrice) / myPrice * 100).toFixed(1) + '%' });\n  }\n}\n\nreturn { alerts, alertCount: alerts.length };" } },
      { id: "condition", type: "condition", position: { x: 850, y: 200 }, data: { label: "Any Alerts?", condition: "outputs['code']?.alertCount > 0" } },
      { id: "webhook", type: "webhook", position: { x: 1100, y: 200 }, data: { label: "Notify Slack", webhookUrl: "https://hooks.slack.com/services/...", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "http", animated: true },
      { id: "e2", source: "http", target: "code", animated: true },
      { id: "e3", source: "code", target: "condition", animated: true },
      { id: "e4", source: "condition", target: "webhook", sourceHandle: "true", animated: true },
    ],
  },

  // ─── Developer Tools ────────────────────────────────────
  {
    id: "github-commit-summarizer",
    name: "GitHub Commit Summarizer",
    description: "Fetch recent commits from a repo, summarize changes with an LLM, and post to a webhook.",
    category: "developer-tools",
    icon: "code",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Daily Digest", triggerType: "schedule", schedule: "0 18 * * *" } },
      { id: "http", type: "http_request", position: { x: 350, y: 200 }, data: { label: "Fetch Commits", method: "GET", url: "https://api.github.com/repos/your-org/your-repo/commits?per_page=10" } },
      { id: "llm", type: "llm_call", position: { x: 600, y: 200 }, data: { label: "Summarize Commits", model: "deepseek-v4-flash", prompt: "Summarize today's commits into a short changelog for the team. Group related changes.\n\nCommits: {{http.output}}", temperature: 0.5 } },
      { id: "webhook", type: "webhook", position: { x: 850, y: 200 }, data: { label: "Post to Teams", webhookUrl: "https://hooks.slack.com/services/...", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "http", animated: true },
      { id: "e2", source: "http", target: "llm", animated: true },
      { id: "e3", source: "llm", target: "webhook", animated: true },
    ],
  },
  {
    id: "code-review-assistant",
    name: "Code Review Assistant",
    description: "Receive a PR diff via webhook, analyze with LLM for issues, and post review comments.",
    category: "developer-tools",
    icon: "code",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "PR Webhook", triggerType: "webhook" } },
      { id: "http", type: "http_request", position: { x: 350, y: 200 }, data: { label: "Fetch PR Diff", method: "GET", url: "{{trigger.diff_url}}", headers: '{"Accept":"application/vnd.github.v3.diff"}' } },
      { id: "llm", type: "llm_call", position: { x: 600, y: 200 }, data: { label: "Review Code", model: "deepseek-v4-flash", prompt: "Review this pull request diff. Identify: 1) bugs, 2) security issues, 3) style problems, 4) performance concerns. Be concise.\n\nDiff:\n{{http.output}}", systemPrompt: "You are an expert code reviewer. Be constructive and specific.", temperature: 0.3 } },
      { id: "webhook", type: "webhook", position: { x: 850, y: 200 }, data: { label: "Post Review", webhookUrl: "https://api.github.com/repos/your-org/your-repo/pulls/{{trigger.pr_number}}/reviews", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "http", animated: true },
      { id: "e2", source: "http", target: "llm", animated: true },
      { id: "e3", source: "llm", target: "webhook", animated: true },
    ],
  },
  {
    id: "deploy-announcer",
    name: "Deploy Announcer",
    description: "Notify multiple channels when a deployment happens via incoming webhook.",
    category: "developer-tools",
    icon: "code",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Deploy Hook", triggerType: "webhook" } },
      { id: "code", type: "code_runner", position: { x: 350, y: 200 }, data: { label: "Format Message", code: "const deploy = outputs['trigger'];\nconst message = {\n  text: `🚀 *Deploy Complete*\n• Service: ${deploy.service || 'unknown'}\n• Version: ${deploy.version || 'N/A'}\n• Environment: ${deploy.environment || 'production'}\n• Duration: ${deploy.duration || 'N/A'}\n• Commit: ${deploy.commit || 'N/A'}`\n};\nreturn message;" } },
      { id: "webhook_slack", type: "webhook", position: { x: 600, y: 100 }, data: { label: "Notify Slack", webhookUrl: "https://hooks.slack.com/services/...", webhookMethod: "POST" } },
      { id: "webhook_discord", type: "webhook", position: { x: 600, y: 300 }, data: { label: "Notify Discord", webhookUrl: "https://discord.com/api/webhooks/...", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "code", animated: true },
      { id: "e2", source: "code", target: "webhook_slack", animated: true },
      { id: "e3", source: "code", target: "webhook_discord", animated: true },
    ],
  },
  {
    id: "database-backup-reminder",
    name: "Database Backup Monitor",
    description: "Check backup status via API and alert if the latest backup is older than 24 hours.",
    category: "developer-tools",
    icon: "code",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Every 6 Hours", triggerType: "schedule", schedule: "0 */6 * * *" } },
      { id: "http", type: "http_request", position: { x: 350, y: 200 }, data: { label: "Check Backup Status", method: "GET", url: "https://api.example.com/backups/latest" } },
      { id: "condition", type: "condition", position: { x: 600, y: 200 }, data: { label: "Older than 24h?", condition: "Date.now() - new Date(outputs['http']?.body?.created_at).getTime() > 86400000" } },
      { id: "webhook", type: "webhook", position: { x: 850, y: 200 }, data: { label: "Alert On-Call", webhookUrl: "https://hooks.example.com/oncall", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "http", animated: true },
      { id: "e2", source: "http", target: "condition", animated: true },
      { id: "e3", source: "condition", target: "webhook", sourceHandle: "true", animated: true },
    ],
  },

  // ─── Business Automation ────────────────────────────────
  {
    id: "form-lead-processor",
    name: "Form Lead Processor",
    description: "Receive form submissions, validate data, enrich with Clearbit, and save to CRM.",
    category: "business-automation",
    icon: "briefcase",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Form Submission", triggerType: "webhook" } },
      { id: "code", type: "code_runner", position: { x: 350, y: 200 }, data: { label: "Validate Input", code: "const lead = outputs['trigger'];\nconst errors = [];\n\nif (!lead.email || !lead.email.includes('@')) errors.push('Invalid email');\nif (!lead.name) errors.push('Name is required');\n\nreturn {\n  ...lead,\n  valid: errors.length === 0,\n  errors,\n  timestamp: new Date().toISOString()\n};" } },
      { id: "condition", type: "condition", position: { x: 600, y: 200 }, data: { label: "Valid Lead?", condition: "outputs['code']?.valid === true" } },
      { id: "http", type: "http_request", position: { x: 850, y: 200 }, data: { label: "Create CRM Lead", method: "POST", url: "https://api.hubspot.com/crm/v3/objects/contacts", headers: '{"Content-Type":"application/json","Authorization":"Bearer YOUR_HUBSPOT_KEY"}', body: '{"properties":{"email":"{{code.email}}","firstname":"{{code.name}}"}}' } },
      { id: "webhook", type: "webhook", position: { x: 1100, y: 200 }, data: { label: "Notify Sales", webhookUrl: "https://hooks.slack.com/services/...", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "code", animated: true },
      { id: "e2", source: "code", target: "condition", animated: true },
      { id: "e3", source: "condition", target: "http", sourceHandle: "true", animated: true },
      { id: "e4", source: "http", target: "webhook", animated: true },
    ],
  },
  {
    id: "invoice-processor",
    name: "Invoice Processor",
    description: "Receive invoice data, validate totals, check against budget, and route for approval.",
    category: "business-automation",
    icon: "briefcase",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Invoice Received", triggerType: "webhook" } },
      { id: "code", type: "code_runner", position: { x: 350, y: 200 }, data: { label: "Validate Invoice", code: "const inv = outputs['trigger'];\nconst subtotal = inv.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;\nconst taxRate = inv.taxRate || 0.1;\nconst expectedTotal = subtotal * (1 + taxRate);\nconst discrepancy = Math.abs(expectedTotal - (inv.total || 0));\n\nreturn {\n  ...inv,\n  computedSubtotal: subtotal,\n  expectedTotal: Math.round(expectedTotal * 100) / 100,\n  discrepancy: Math.round(discrepancy * 100) / 100,\n  isValid: discrepancy < 0.02,\n  needsApproval: inv.total > 5000\n};" } },
      { id: "condition", type: "condition", position: { x: 600, y: 200 }, data: { label: "Amount > $5k?", condition: "outputs['code']?.needsApproval === true" } },
      { id: "webhook_manager", type: "webhook", position: { x: 850, y: 100 }, data: { label: "Send for Manager Approval", webhookUrl: "https://api.example.com/approvals", webhookMethod: "POST" } },
      { id: "webhook_auto", type: "webhook", position: { x: 850, y: 300 }, data: { label: "Auto-Process Payment", webhookUrl: "https://api.example.com/payments", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "code", animated: true },
      { id: "e2", source: "code", target: "condition", animated: true },
      { id: "e3", source: "condition", target: "webhook_manager", sourceHandle: "true", animated: true },
      { id: "e4", source: "condition", target: "webhook_auto", sourceHandle: "false", animated: true },
    ],
  },
  {
    id: "customer-feedback-analyzer",
    name: "Customer Feedback Analyzer",
    description: "Receive feedback, analyze sentiment with LLM, and route to support or product teams.",
    category: "business-automation",
    icon: "briefcase",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Feedback Submitted", triggerType: "webhook" } },
      { id: "llm", type: "llm_call", position: { x: 350, y: 200 }, data: { label: "Analyze Feedback", model: "deepseek-v4-flash", prompt: "Analyze this customer feedback. Return JSON:\n{\"sentiment\": \"positive|negative|neutral\", \"category\": \"bug|feature|ux|billing|other\", \"priority\": \"low|medium|high\", \"summary\": \"one-line summary\"}\n\nFeedback: {{trigger.output}}", temperature: 0.2 } },
      { id: "condition", type: "condition", position: { x: 600, y: 200 }, data: { label: "Is Bug?", condition: "outputs['llm']?.text?.toLowerCase().includes('\"bug\"') || outputs['llm']?.text?.toLowerCase().includes('\"category\": \"bug\"')" } },
      { id: "webhook_support", type: "webhook", position: { x: 850, y: 100 }, data: { label: "Create Support Ticket", webhookUrl: "https://api.example.com/support/tickets", webhookMethod: "POST" } },
      { id: "webhook_product", type: "webhook", position: { x: 850, y: 300 }, data: { label: "Log Feature Request", webhookUrl: "https://api.example.com/product/feedback", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "llm", animated: true },
      { id: "e2", source: "llm", target: "condition", animated: true },
      { id: "e3", source: "condition", target: "webhook_support", sourceHandle: "true", animated: true },
      { id: "e4", source: "condition", target: "webhook_product", sourceHandle: "false", animated: true },
    ],
  },
  {
    id: "automated-report-generator",
    name: "Automated Report Generator",
    description: "Pull data weekly, analyze with LLM, and generate a formatted report for stakeholders.",
    category: "business-automation",
    icon: "briefcase",
    nodes: [
      { id: "trigger", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Weekly", triggerType: "schedule", schedule: "0 8 * * 1" } },
      { id: "http_metrics", type: "http_request", position: { x: 350, y: 100 }, data: { label: "Pull KPIs", method: "GET", url: "https://api.example.com/metrics/weekly" } },
      { id: "http_revenue", type: "http_request", position: { x: 350, y: 300 }, data: { label: "Pull Revenue", method: "GET", url: "https://api.example.com/revenue/weekly" } },
      { id: "llm", type: "llm_call", position: { x: 600, y: 200 }, data: { label: "Generate Report", model: "deepseek-v4-flash", prompt: "Generate a weekly business report with:\n1. Executive summary\n2. Key metrics analysis\n3. Revenue highlights\n4. Recommendations\n\nMetrics: {{http_metrics.output}}\nRevenue: {{http_revenue.output}}", temperature: 0.4 } },
      { id: "webhook", type: "webhook", position: { x: 850, y: 200 }, data: { label: "Email to Stakeholders", webhookUrl: "https://api.resend.com/emails", webhookMethod: "POST" } },
    ],
    edges: [
      { id: "e1", source: "trigger", target: "http_metrics", animated: true },
      { id: "e2", source: "trigger", target: "http_revenue", animated: true },
      { id: "e3", source: "http_metrics", target: "llm", animated: true },
      { id: "e4", source: "http_revenue", target: "llm", animated: true },
      { id: "e5", source: "llm", target: "webhook", animated: true },
    ],
  },
]
