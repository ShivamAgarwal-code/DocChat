"use client"
import { useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Upload, Link, FileText, FileSpreadsheet, File } from "lucide-react"
import "@/lib/pdfWorker" // Load worker first
import * as pdfjsLib from "pdfjs-dist"

interface DocumentInputProps {
  onDocumentLoad: (url: string, name: string, type: string,documentData:any) => void
}

export function DocumentInput({ onDocumentLoad }: DocumentInputProps) {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const getFileTypeFromUrl = (url: string) => {
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
      default:
        return "pdf"
    }
  }

  const getFileNameFromUrl = (url: string) => {
    return url.split("/").pop() || "document"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setIsLoading(true)
    try {
      const documentData = await extractDocumentData(url);
      const fileType = getFileTypeFromUrl(url)
      const fileName = getFileNameFromUrl(url)
      onDocumentLoad(url, fileName, fileType,documentData)
    } catch (error) {
      console.error("Error loading document:", error)
    } finally {
      setIsLoading(false)
    }
  }

const extractDocumentData = async (url: string): Promise<string> => {
  try {
    const googleDocMatch = url.match(/docs\.google\.com\/document\/d\/([^/]+)/);
    if (googleDocMatch) {
      const docId = googleDocMatch[1];
      const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
      const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(exportUrl)}`);
      if (!response.ok) throw new Error('Failed to fetch Google Doc');
      return await response.text();
    }

    if (url.endsWith('.txt') || url.endsWith('.json')) {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch text file');
      return await response.text();
    }

    if (url.endsWith('.pdf')) {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const loadingTask = pdfjsLib.getDocument(proxyUrl);
      const pdf = await loadingTask.promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        fullText += strings.join(' ') + '\n\n';
      }

      return fullText || `No text content found in PDF: ${url}`;
    }

    return `Unsupported file type. Loaded from: ${url}`;
  } catch (error) {
    console.error('Error extracting document data:', error);
    return `Failed to extract content from: ${url}`;
  }
};

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4" />
      case "excel":
        return <FileSpreadsheet className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Upload className="h-4 w-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Load Document</h3>
      </div>

      <Card className="p-5 bg-white/60 border-gray-200/50">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Document URL</label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/document.pdf"
                className="pl-10 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                disabled={isLoading}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={!url.trim() || isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? "Loading..." : "Load Document"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200/50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Supported formats:</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <FileText className="h-4 w-4 text-red-500" />
              <span>PDF</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <File className="h-4 w-4 text-blue-500" />
              <span>Word</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <FileSpreadsheet className="h-4 w-4 text-green-500" />
              <span>Excel</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
