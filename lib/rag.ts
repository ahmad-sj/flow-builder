import { embed } from "ai"
import { google } from "@ai-sdk/google"
import { sql } from "@/lib/db"

const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 50

// Split text into overlapping chunks
export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = []
  const sentences = text.split(/[.!?]+\s+/)
  let currentChunk = ""

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      // Overlap: keep some of the end of the previous chunk
      const words = currentChunk.split(" ")
      const overlapWords = words.slice(Math.max(0, words.length - Math.ceil(overlap / 5)))
      currentChunk = overlapWords.join(" ") + " " + sentence
    } else {
      currentChunk += (currentChunk ? ". " : "") + sentence
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

// Generate embedding for text
export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embed({
    model: google.textEmbeddingModel("text-embedding-004"),
    value: text,
  })
  return Array.from(result.embedding)
}

// Ingest a document: chunk it, embed chunks, store in DB
export async function ingestDocument(
  userId: string,
  name: string,
  content: string,
  metadata: Record<string, unknown> = {}
) {
  // Store the document
  const docs = await sql`
    INSERT INTO knowledge_documents (user_id, name, content, metadata)
    VALUES (${userId}, ${name}, ${content}, ${JSON.stringify(metadata)})
    RETURNING id
  `
  const documentId = docs[0].id

  // Chunk the content
  const chunks = chunkText(content)

  // Generate embeddings and store chunks
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i])
    const embeddingStr = `[${embedding.join(",")}]`

    await sql`
      INSERT INTO document_chunks (document_id, content, embedding, chunk_index)
      VALUES (${documentId}, ${chunks[i]}, ${embeddingStr}::vector, ${i})
    `
  }

  return { documentId, chunksCreated: chunks.length }
}

// Semantic search across document chunks
export async function searchDocuments(
  userId: string,
  query: string,
  limit = 5
): Promise<Array<{ content: string; documentName: string; score: number }>> {
  const queryEmbedding = await generateEmbedding(query)
  const embeddingStr = `[${queryEmbedding.join(",")}]`

  const results = await sql`
    SELECT
      dc.content,
      kd.name as document_name,
      1 - (dc.embedding <=> ${embeddingStr}::vector) as similarity
    FROM document_chunks dc
    JOIN knowledge_documents kd ON dc.document_id = kd.id
    WHERE kd.user_id = ${userId}
    ORDER BY dc.embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `

  return results.map((r) => ({
    content: r.content,
    documentName: r.document_name,
    score: r.similarity,
  }))
}
