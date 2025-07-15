import { type NextRequest, NextResponse } from "next/server"
import mammoth from "mammoth"
import * as XLSX from "xlsx"
import "@/lib/pdfWorker"
import * as pdfjsLib from "pdfjs-dist"
// import pdfjsWorker from '../../../../node_modules/pdfjs-dist/build/pdf.worker';



export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log("Processing document:", url)

    // Detect document type
    const documentType = getDocumentType(url)

    console.log('====================================');
    console.log(documentType,"document type");
    console.log('====================================');

    // For Excel and Google Sheets, return minimal processing since we'll use iframe
    if (documentType === "excel" || documentType === "google-sheet") {
      return NextResponse.json({
        success: true,
        data: {
          url,
          name: getFileNameFromUrl(url),
          type: documentType,
          content: null, // Will be handled by iframe
          metadata: { useIframe: true },
          processedAt: new Date().toISOString(),
        },
      })
    }

    // Fetch document with proper headers
    const documentBuffer = await fetchDocument(url)

    // Extract content based on type
    let extractedContent = ""
    let metadata = {}

    switch (documentType) {
      case "pdf":
        const pdfResult = await extractPDFContent(documentBuffer)
        extractedContent = pdfResult.text
        metadata = pdfResult.metadata
        break
      case "word":
        extractedContent = await extractWordContent(documentBuffer)
        break
      case "google-doc":
        extractedContent = await extractGoogleDocContent(url)
        break
      default:
        extractedContent = await extractTextContent(documentBuffer)
    }

    const fileName = getFileNameFromUrl(url)

    return NextResponse.json({
      success: true,
      data: {
        url,
        name: fileName,
        type: documentType,
        content: extractedContent,
        metadata,
        processedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Document processing error:", error)
    return NextResponse.json(
      {
        error: "Failed to process document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function getDocumentType(url: string): string {
  if (url.includes("docs.google.com/document")) return "google-doc"
  if (url.includes("docs.google.com/spreadsheets")) return "google-sheet"

  const extension = url.split(".").pop()?.toLowerCase()
  switch (extension) {
    case "pdf":
      return "pdf"
    case "doc":
    case "docx":
      return "word"
    case "xls":
    case "xlsx":
      return "excel"
    case "txt":
      return "text"
    default:
      return "pdf" // Default assumption
  }
}

function getFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const fileName = pathname.split("/").pop() || "document"
    return decodeURIComponent(fileName)
  } catch {
    return "document"
  }
}

async function fetchDocument(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.arrayBuffer()
}

async function extractPDFContent(buffer: ArrayBuffer) {
  try {


    const loadingTask = pdfjsLib.getDocument({ 
      data: buffer,
      isEvalSupported: false,
    })
    // const loadingTask = pdfjsLib.getDocument({ 
    //   data: buffer,
    //   useWorkerFetch: false,
    //   isEvalSupported: false,
    //   useSystemFonts: true
    // })
    const pdf = await loadingTask.promise

    let fullText = ""
    const metadata = {
      numPages: pdf.numPages,
      title: "",
      author: "",
      subject: "",
      creator: "",
    }

    // Extract metadata
    try {
      const pdfMetadata = await pdf.getMetadata()
      if (pdfMetadata.info) {
        metadata.title = pdfMetadata.info.Title || ""
        metadata.author = pdfMetadata.info.Author || ""
        metadata.subject = pdfMetadata.info.Subject || ""
        metadata.creator = pdfMetadata.info.Creator || ""
      }
    } catch (e) {
      console.warn("Could not extract PDF metadata:", e)
    }

    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const strings = content.items
          .filter((item: any) => item.str && typeof item.str === 'string')
          .map((item: any) => item.str)
        fullText += strings.join(" ") + "\n\n"
      } catch (pageError) {
        console.warn(`Error extracting text from page ${i}:`, pageError)
        fullText += `[Page ${i}: Content extraction failed]\n\n`
      }
    }

    return {
      text: fullText.trim() || "No text content found in PDF",
      metadata,
    }
  } catch (error) {
    console.error("PDF extraction error:", error)
    throw new Error("Failed to extract PDF content: " + (error instanceof Error ? error.message : "Unknown error"))
  }
}

async function extractWordContent(buffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    return result.value || "No text content found in Word document"
  } catch (error) {
    console.error("Word extraction error:", error)
    throw new Error("Failed to extract Word content: " + (error instanceof Error ? error.message : "Unknown error"))
  }
}

async function extractGoogleDocContent(url: string): Promise<string> {
  try {
    // Extract document ID from Google Docs URL
    const docIdMatch = url.match(/docs\.google\.com\/document\/d\/([^/]+)/)
    if (!docIdMatch) {
      throw new Error("Invalid Google Docs URL")
    }

    const docId = docIdMatch[1]
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`

    const response = await fetch(exportUrl)
    if (!response.ok) {
      throw new Error(`Failed to export Google Doc: ${response.status}`)
    }

    const text = await response.text()
    return text || "No content found in Google Document"
  } catch (error) {
    console.error("Google Docs extraction error:", error)
    throw new Error("Failed to extract Google Docs content: " + (error instanceof Error ? error.message : "Unknown error"))
  }
}

async function extractTextContent(buffer: ArrayBuffer): Promise<string> {
  try {
    const decoder = new TextDecoder("utf-8")
    return decoder.decode(buffer)
  } catch (error) {
    console.error("Text extraction error:", error)
    throw new Error("Failed to extract text content: " + (error instanceof Error ? error.message : "Unknown error"))
  }
}