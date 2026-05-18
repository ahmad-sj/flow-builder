import { streamText, convertToModelMessages, tool, stepCountIs } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export const maxDuration = 60;

function buildFlowTools(userId: string) {
  return {
    createFlow: tool({
      description:
        "Create a new workflow flow with the given name and description",
      inputSchema: z.object({
        name: z.string().describe("Name of the flow"),
        description: z.string().nullable().describe("Description of the flow"),
      }),
      execute: async ({ name, description }) => {
        const flows = await sql`
          INSERT INTO flows (user_id, name, description)
          VALUES (${userId}, ${name}, ${description || ""})
          RETURNING id, name
        `;
        return {
          flowId: flows[0].id,
          name: flows[0].name,
          message: `Flow "${name}" created successfully.`,
        };
      },
    }),

    listFlows: tool({
      description: "List all flows belonging to the current user",
      inputSchema: z.object({}),
      execute: async () => {
        const flows = await sql`
          SELECT id, name, description, is_active, created_at
          FROM flows WHERE user_id = ${userId}
          ORDER BY updated_at DESC
        `;
        return { flows, count: flows.length };
      },
    }),

    addNode: tool({
      description:
        "Add a new node to the current flow being edited. Node types: trigger, http_request, code_runner, condition, llm_call, webhook, log, color, save_pdf",
      inputSchema: z.object({
        flowId: z.string().describe("The flow ID to add the node to"),
        nodeType: z.enum([
          "trigger",
          "http_request",
          "code_runner",
          "condition",
          "llm_call",
          "webhook",
          "log",
          "color",
          "save_pdf",
        ]),
        label: z.string().describe("Display label for the node"),
        positionX: z.number().describe("X position on the canvas"),
        positionY: z.number().describe("Y position on the canvas"),
        config: z
          .record(z.unknown())
          .nullable()
          .describe(
            "Node config: for llm_call use {model:'deepseek-v4-flash', prompt:'...', systemPrompt:'...', temperature:0.7, outputFormat:'webpage' for clean HTML reports}. For http_request use {url:'...', method:'GET'}. For code_runner use {code:'...'}. For condition use {condition:'...'}. For webhook use {webhookUrl:'...', webhookMethod:'POST'}. For save_pdf use {filename:'output.pdf', format:'A4'}.",
          ),
      }),
      execute: async ({
        flowId,
        nodeType,
        label,
        positionX,
        positionY,
        config,
      }) => {
        const flows =
          await sql`SELECT nodes FROM flows WHERE id = ${flowId} AND user_id = ${userId}`;
        if (flows.length === 0) return { error: "Flow not found" };

        const nodes = flows[0].nodes || [];
        const newNode = {
          id: `node_${Date.now()}`,
          type: nodeType,
          position: { x: positionX, y: positionY },
          data: { label, ...((config as Record<string, unknown>) || {}) },
        };
        nodes.push(newNode);

        await sql`UPDATE flows SET nodes = ${JSON.stringify(nodes)}, updated_at = NOW() WHERE id = ${flowId}`;
        return {
          node: newNode,
          message: `Added ${nodeType} node "${label}" to the flow.`,
        };
      },
    }),

    addEdge: tool({
      description: "Connect two nodes in the flow with an edge",
      inputSchema: z.object({
        flowId: z.string().describe("The flow ID"),
        sourceNodeId: z.string().describe("Source node ID"),
        targetNodeId: z.string().describe("Target node ID"),
        sourceHandle: z
          .string()
          .optional()
          .describe(
            "Source handle (e.g., 'true' or 'false' for condition nodes)",
          ),
      }),
      execute: async ({ flowId, sourceNodeId, targetNodeId, sourceHandle }) => {
        const flows =
          await sql`SELECT edges FROM flows WHERE id = ${flowId} AND user_id = ${userId}`;
        if (flows.length === 0) return { error: "Flow not found" };

        const edges = flows[0].edges || [];
        const newEdge = {
          id: `edge_${Date.now()}`,
          source: sourceNodeId,
          target: targetNodeId,
          sourceHandle: sourceHandle || undefined,
          animated: true,
        };
        edges.push(newEdge);

        await sql`UPDATE flows SET edges = ${JSON.stringify(edges)}, updated_at = NOW() WHERE id = ${flowId}`;
        return { edge: newEdge, message: "Edge created successfully." };
      },
    }),

    getFlowDetails: tool({
      description:
        "Get details of a specific flow including its nodes and edges",
      inputSchema: z.object({
        flowId: z.string().describe("The flow ID to retrieve"),
      }),
      execute: async ({ flowId }) => {
        const flows = await sql`
          SELECT id, name, description, nodes, edges, is_active, created_at
          FROM flows WHERE id = ${flowId} AND user_id = ${userId}
        `;
        if (flows.length === 0) return { error: "Flow not found" };
        return flows[0];
      },
    }),

    updateNodeConfig: tool({
      description: "Update configuration of an existing node",
      inputSchema: z.object({
        flowId: z.string().describe("The flow ID"),
        nodeId: z.string().describe("The node ID to update"),
        config: z
          .record(z.unknown())
          .describe("New configuration data to merge with existing"),
      }),
      execute: async ({ flowId, nodeId, config }) => {
        const flows =
          await sql`SELECT nodes FROM flows WHERE id = ${flowId} AND user_id = ${userId}`;
        if (flows.length === 0) return { error: "Flow not found" };

        const nodes = flows[0].nodes || [];
        const nodeIndex = nodes.findIndex(
          (n: { id: string }) => n.id === nodeId,
        );
        if (nodeIndex === -1) return { error: "Node not found" };

        nodes[nodeIndex].data = {
          ...nodes[nodeIndex].data,
          ...(config as Record<string, unknown>),
        };
        await sql`UPDATE flows SET nodes = ${JSON.stringify(nodes)}, updated_at = NOW() WHERE id = ${flowId}`;
        return {
          node: nodes[nodeIndex],
          message: "Node updated successfully.",
        };
      },
    }),

    deleteNode: tool({
      description: "Delete a node from the flow",
      inputSchema: z.object({
        flowId: z.string().describe("The flow ID"),
        nodeId: z.string().describe("The node ID to delete"),
      }),
      execute: async ({ flowId, nodeId }) => {
        const flows =
          await sql`SELECT nodes, edges FROM flows WHERE id = ${flowId} AND user_id = ${userId}`;
        if (flows.length === 0) return { error: "Flow not found" };

        const nodes = (flows[0].nodes || []).filter(
          (n: { id: string }) => n.id !== nodeId,
        );
        const edges = (flows[0].edges || []).filter(
          (e: { source: string; target: string }) =>
            e.source !== nodeId && e.target !== nodeId,
        );

        await sql`UPDATE flows SET nodes = ${JSON.stringify(nodes)}, edges = ${JSON.stringify(edges)}, updated_at = NOW() WHERE id = ${flowId}`;
        return {
          message: `Node ${nodeId} and its connected edges have been deleted.`,
        };
      },
    }),

    clearFlow: tool({
      description: "Remove all nodes and edges from the flow, starting fresh",
      inputSchema: z.object({
        flowId: z.string().describe("The flow ID to clear"),
      }),
      execute: async ({ flowId }) => {
        const flows =
          await sql`SELECT id FROM flows WHERE id = ${flowId} AND user_id = ${userId}`;
        if (flows.length === 0) return { error: "Flow not found" };

        await sql`UPDATE flows SET nodes = '[]', edges = '[]', updated_at = NOW() WHERE id = ${flowId}`;
        return {
          message:
            "Flow has been cleared. All nodes and edges have been removed.",
        };
      },
    }),

    executeFlow: tool({
      description:
        "Execute a flow by its ID. Returns a summary of the execution.",
      inputSchema: z.object({
        flowId: z.string().describe("The flow ID to execute"),
      }),
      execute: async ({ flowId }) => {
        const flows = await sql`
          SELECT nodes, edges FROM flows WHERE id = ${flowId} AND user_id = ${userId}
        `;
        if (flows.length === 0) return { error: "Flow not found" };

        const { executeFlow: runFlow } = await import("@/lib/flow-engine");

        const results: unknown[] = [];
        await runFlow(flows[0].nodes, flows[0].edges, (data) => {
          results.push(data);
        });

        return { results, message: "Flow execution completed." };
      },
    }),
  };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const {
    messages,
    flowId,
    currentNodes,
    currentEdges,
    model: selectedModel,
  } = await req.json();

  const userId = session.user.id;

  // Build tools with userId closure
  const tools = buildFlowTools(userId);

  const flowContext = flowId
    ? `The user is currently editing flow with ID "${flowId}".
Current nodes: ${JSON.stringify(currentNodes || [])}
Current edges: ${JSON.stringify(currentEdges || [])}

CRITICAL: You are INSIDE this flow. You must use "addNode" and "addEdge" with this exact flowId.
NEVER call createFlow — the flow already exists. Always modify the current flow.`
    : `No flow is currently open. If the user asks to create nodes or edges, call createFlow first to create a new flow, then use the returned flowId.`;

// Determine the model to use
  let chatModel
  console.log('Selected model from body:', selectedModel)
  
  if (selectedModel === "deepseek-chat" || !selectedModel) {
    chatModel = deepseek("deepseek-chat")
  } else if (selectedModel === "gpt-4o") {
    chatModel = openai("gpt-4o")
  } else if (selectedModel === "gpt-4o-mini") {
    chatModel = openai("gpt-4o-mini")
  } else if (selectedModel === "gemini-2.0-flash" || selectedModel === "gemini-1.5-flash") {
    const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured" }), {
        status: 500,
      });
    }
    chatModel = google(selectedModel)
  } else if (selectedModel === "openrouter" || (typeof selectedModel === "string" && selectedModel.startsWith("openrouter/"))) {
    const openrouterApiKey = process.env.OPENROUTER_API_KEY
    if (!openrouterApiKey) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY is not configured" }), {
        status: 500,
      });
    }
    const modelName = selectedModel === "openrouter" ? "openai/gpt-4o" : selectedModel.replace("openrouter/", "")
    console.log('Using OpenRouter model:', modelName)
    chatModel = createOpenAI({
      apiKey: openrouterApiKey,
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        "HTTP-Referer": "https://github.com/flow-builder-ai",
        "X-Title": "Flow Builder AI",
      },
    })(modelName)
  } else {
    // Fallback to default
    chatModel = deepseek("deepseek-chat")
  }

  const result = streamText({
    model: chatModel,
    system: `You are FlowBuilder AI, an intelligent assistant that helps users build and manage workflow automations.

You can:
- Add nodes (trigger, http_request, code_runner, condition, llm_call, webhook, log, color, save_pdf)
- Connect nodes with edges
- Update node configurations
- Delete nodes
- Delete all nodes (clearFlow)
- Execute flows
- List existing flows

${flowContext}

CRITICAL RULES:
1. After EVERY addNode call, you MUST call addEdge to connect the new node to the previous node (except for the first node).
2. NEVER add a node without immediately adding an edge to connect it in the flow chain.
3. For llm_call nodes, always set config.model to "deepseek-v4-flash" unless the user specifies otherwise.
4. For trigger nodes, no config is needed.
5. For http_request nodes, set config.url and config.method.
6. For code_runner nodes, set config.code.
7. For condition nodes, set config.condition.
8. For log nodes, output shows data in execution log popup.
9. For color nodes, output shows data with random color in execution log.
10. For save_pdf nodes, output generates a downloadable PDF file.
11. before giving input to save_pdf nodes, make sure the input doesn't contain charaters that are used for text formatting.

When building flows, always follow this sequence:
1. addNode(trigger) at (100, 200)
2. addEdge to connect it to the next node
3. Repeat for each subsequent node

When positioning nodes, space them with 250px horizontal gaps and 150px vertical gaps.
Place nodes sequentially: (100,200), (350,200), (600,200), etc.

Always confirm what you've done after each action and suggest logical next steps.`,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
