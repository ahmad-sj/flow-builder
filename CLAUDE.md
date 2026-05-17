# FlowBuilder AI

A visual workflow automation platform powered by AI. Build, execute, and manage multi-step automations using a drag-and-drop canvas — or just describe what you want to an AI assistant and watch it build the flow for you.

---

## Features

- **Visual Flow Canvas** — drag-and-drop node editor built on React Flow (`@xyflow/react`)
- **AI-Assisted Flow Building** — chat with FlowBuilder AI to create, modify, and execute flows using natural language
- **6 Node Types** — Trigger, HTTP Request, Code Runner, Condition, LLM Call, Webhook
- **Real-time Execution Logs** — SSE-streamed node-by-node execution feedback
- **Knowledge Base (RAG)** — ingest documents, generate vector embeddings, and run semantic search
- **Authentication** — email/password auth with NextAuth v5 (JWT sessions)
- **Dark/Light Theme** — via `next-themes`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.7 |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Radix UI |
| Flow Canvas | @xyflow/react 12 |
| AI / LLM | Vercel AI SDK 6, DeepSeek (`deepseek-chat`) |
| Embeddings | Google `text-embedding-004` via `@ai-sdk/google` |
| Database | Neon (serverless Postgres) with `pgvector` |
| Auth | NextAuth v5 (credentials + JWT) |
| Deployment | Vercel |

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── ai/chat/          # AI assistant endpoint (streaming, tool use)
│   │   ├── auth/             # NextAuth handlers + registration
│   │   ├── flows/            # CRUD + execution API for flows
│   │   └── knowledge/        # Document ingestion + semantic search API
│   ├── dashboard/            # Main dashboard page
│   ├── flow/[id]/            # Flow editor page
│   ├── knowledge/            # Knowledge base management page
│   ├── login/                # Login page
│   └── register/             # Registration page
├── components/
│   ├── ai/                   # AI chat panel
│   ├── flow/                 # Canvas, toolbar, node panel, execution log
│   │   └── nodes/            # Individual node components (6 types)
│   └── ui/                   # shadcn/ui component library
├── lib/
│   ├── auth.ts               # NextAuth configuration
│   ├── db.ts                 # Neon DB client + type definitions
│   ├── flow-engine.ts        # Flow executor (topological sort + SSE)
│   ├── flow-types.ts         # Shared flow node/edge type definitions
│   ├── rag.ts                # Chunking, embedding, and vector search
│   └── utils.ts              # Utility helpers
└── types/
    └── next-auth.d.ts        # Session type augmentation
```

---

## Node Types

| Node | Purpose |
|---|---|
| **Trigger** | Entry point — manual, scheduled, or webhook-triggered |
| **HTTP Request** | Fetch external APIs (GET, POST, PUT, DELETE, PATCH) |
| **Code Runner** | Execute JavaScript with access to previous node outputs |
| **Condition** | Branch execution based on a boolean expression |
| **LLM Call** | Send a prompt to DeepSeek and capture the response |
| **Webhook** | POST (or other method) to an external webhook URL |

Nodes support `{{nodeId.field}}` template syntax to reference outputs from upstream nodes.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) Postgres database with `pgvector` enabled
- DeepSeek API key
- Google AI API key (for embeddings)

### Installation

```bash
git clone <repo-url>
cd <project>
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
DATABASE_URL=postgresql://...         # Neon connection string
NEXTAUTH_SECRET=your-secret-here
DEEPSEEK_API_KEY=your-deepseek-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key
```

### Database Setup

Run the following SQL against your Neon database to create the required tables:

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flows
CREATE TABLE flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  nodes JSONB DEFAULT '[]',
  edges JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge documents
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks with vector embeddings
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(768),
  chunk_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Run

```bash
npm run dev      # Development
npm run build    # Production build
npm run start    # Production server
```

---

## AI Assistant

The AI chat panel (`/api/ai/chat`) uses DeepSeek with structured tool calls to manipulate flows in real time. Available tools:

- `createFlow` — create a new flow
- `listFlows` — list all user flows
- `addNode` — add a node to the current flow
- `addEdge` — connect two nodes
- `updateNodeConfig` — update an existing node's configuration
- `deleteNode` — remove a node and its edges
- `getFlowDetails` — retrieve current flow state
- `executeFlow` — run a flow and return results

Example prompts:

> "Create a flow that fetches weather data from an API and summarizes it with an LLM"

> "Add a condition node after the HTTP request that checks if the status is 200"

---

## Knowledge Base

Documents are chunked (500 tokens, 50-token overlap), embedded using Google's `text-embedding-004` model, and stored as `pgvector` vectors in Neon. Semantic search uses cosine similarity (`<=>` operator).

---

## License

MIT