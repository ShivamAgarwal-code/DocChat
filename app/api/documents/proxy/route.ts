import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log("Proxying document:", url)

    // Fetch the document with proper headers
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch document: ${response.status}` }, { status: response.status })
    }

    // Get the document as an array buffer
    const arrayBuffer = await response.arrayBuffer()

    // Return the document as a binary response
    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
        "Content-Length": arrayBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("Document proxy error:", error)
    return NextResponse.json(
      {
        error: "Failed to proxy document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
