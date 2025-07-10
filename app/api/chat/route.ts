import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      system: `You are an intelligent document analysis assistant. You help users understand, analyze, and extract insights from various types of documents including PDFs, Word documents, and Excel spreadsheets.

Your capabilities include:
- Summarizing document content
- Explaining complex concepts in simple terms
- Answering questions about document content
- Identifying key points and takeaways
- Providing analysis and insights
- Helping with document navigation and understanding

Always provide helpful, accurate, and contextual responses based on the document content. If you cannot access the actual document content, acknowledge this limitation and provide general guidance on how to analyze such documents.`,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
