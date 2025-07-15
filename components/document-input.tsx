"use client";

import { useState } from "react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Upload,
  Link,
  FileText,
  FileSpreadsheet,
  File,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { getDocument } from "pdfjs-dist";

interface DocumentInputProps {
  onDocumentLoad: (
    url: string,
    name: string,
    type: string,
    documentData: any
  ) => void;
}

export function DocumentInput({ onDocumentLoad }: DocumentInputProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const trimmedUrl = url.trim();
    try {
      // 🔍 If it's a PDF, handle locally
      if (trimmedUrl.toLowerCase().endsWith(".pdf")) {

        console.log('====================================');
        console.log("added");
        console.log('====================================');
        let fullText = "";

        const loadingTask =await getDocument(trimmedUrl);
        console.log("loadingTask", loadingTask);

        const pdf = await loadingTask.promise;
        console.log("pdf", pdf);

        const metadata = (await pdf.getMetadata())?.metadata || {};

        for (let i = 1; i <= pdf.numPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items
              .filter((item: any) => item.str && typeof item.str === "string")
              .map((item: any) => item.str);
            fullText += strings.join(" ") + "\n\n";
          } catch (pageError) {
            console.warn(`Error extracting text from page ${i}:`, pageError);
            fullText += `[Page ${i}: Content extraction failed]\n\n`;
          }
        }

        // Send data to parent
        onDocumentLoad(trimmedUrl, "Document.pdf", "pdf", {
          content: fullText.trim() || "No text content found in PDF",
          metadata,
          processedAt: new Date().toISOString(),
        });

        setSuccess("Successfully loaded PDF document");
        setUrl("");
      } else {
        const response = await fetch("/api/documents/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: url.trim() }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.details || result.error || "Failed to process document"
          );
        }

        if (result.success && result.data) {
          const {
            url: processedUrl,
            name,
            type,
            content,
            metadata,
          } = result.data;

          // Pass the processed document data to parent component
          onDocumentLoad(processedUrl, name, type, {
            content,
            metadata,
            processedAt: result.data.processedAt,
          });

          setSuccess(`Successfully loaded ${name}`);
          setUrl(""); // Clear the input
        } else {
          throw new Error("Invalid response from server");
        }
      }
    } catch (error) {
      console.error("Error processing document:", error);
      setError(
        error instanceof Error ? error.message : "Failed to process document"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "excel":
        return <FileSpreadsheet className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

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
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Document URL
            </label>
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
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              "Load Document"
            )}
          </Button>
        </form>

        {/* Status Messages */}
        {/* {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-700">
              <strong>Success:</strong> {success}
            </div>
          </div>
        )} */}

        <div className="mt-6 pt-6 border-t border-gray-200/50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Supported formats:
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <FileText className="h-4 w-4 text-red-500" />
              <span>PDF Files</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <File className="h-4 w-4 text-blue-500" />
              <span>Word Documents</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <FileSpreadsheet className="h-4 w-4 text-green-500" />
              <span>Excel Files</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <File className="h-4 w-4 text-orange-500" />
              <span>Google Docs</span>
            </div>
          </div>
        </div>

        {/* <div className="mt-4 pt-4 border-t border-gray-200/50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Test Documents:
          </h4>
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() =>
                setUrl(
                  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                )
              }
            >
              📄 Sample PDF Document
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() =>
                setUrl(
                  "https://docs.google.com/document/d/10FWZnhcrbszFVqS5TrG5FllUy9JA5Ku0BAxGM5f48sU/edit?usp=sharing"
                )
              }
            >
              📝 Sample Google Doc
            </Button>
          </div>
        </div> */}
      </Card>
    </div>
  );
}
