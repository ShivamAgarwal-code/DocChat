import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { messages, documentData, selectedText, action } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // Prepare system message with document context
    const systemMessage = {
      role: "system",
      content: `You are an AI assistant helping users understand and analyze documents.`,
    }

    if (documentData) {
      systemMessage.content += `\n\nDocument context:\n${documentData.slice(0, 4000)}`
    }

    if (selectedText && action) {
      systemMessage.content += `\n\nThe user has selected this text: "${selectedText}"\nThey want you to ${action} this selected text.`
    }

    const chatMessages = [systemMessage, ...messages.filter((m: any) => m.role !== "system")]

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: chatMessages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: data.choices[0].message.content,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      {
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
