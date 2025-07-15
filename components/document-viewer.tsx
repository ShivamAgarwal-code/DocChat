"use client";

import { useState, useEffect, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  FileText,
  Eye,
  FileType,
} from "lucide-react";
import { Button } from "./ui/button";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker - this is crucial for fixing the worker issue
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface DocumentViewerProps {
  documentUrl: string;
  documentType: string;
  onTextSelection?: (text: string) => void;
  selectedText?: string;
}

export function DocumentViewer({
  documentUrl,
  documentType,
  onTextSelection,
  selectedText,
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'text'>('visual'); // Add view mode toggle
  const viewerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load document content when URL changes
  useEffect(() => {
    if (!documentUrl) return;

    const loadDocument = async () => {
      setIsLoading(true);
      setError(null);
      setCurrentPage(1);
      setTotalPages(1);

      try {
        // For Excel and Google Sheets, we'll use iframe directly
        if (documentType === "excel" || documentType === "google-sheet") {
          setIsLoading(false);
          return;
        }

        // ✅ Handle PDF locally using pdfjs-dist
        if (documentType === "pdf") {
          let fullText = "";

          const response = await fetch(documentUrl);
          const arrayBuffer = await response.arrayBuffer();

          const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
            cMapPacked: true,
          });

          const pdf = await loadingTask.promise;
          setPdfDocument(pdf);
          setTotalPages(pdf.numPages);

          console.log('====================================');
          console.log(pdf.getMetadata(),"pdf");
          console.log('====================================');

          for (let i = 1; i <= pdf.numPages; i++) {
            try {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              const strings = content.items
                .filter((item: any) => item.str && typeof item.str === "string")
                .map((item: any) => item.str);
              
              // Add page separator and better formatting
              fullText += `\n--- Page ${i} ---\n`;
              fullText += strings.join(" ") + "\n\n";
            } catch (pageError) {
              console.warn(`Error extracting text from page ${i}:`, pageError);
              fullText += `\n--- Page ${i} ---\n[Content extraction failed]\n\n`;
            }
          }

          console.log('====================================');
          console.log(fullText,"full text");
          console.log('====================================');

          // Set the document content - this was working correctly
          setDocumentContent(fullText.trim() || "No text content found in PDF");
          setIsLoading(false);
          return;
        }

        // For other documents, fetch content from backend
        const response = await fetch("/api/documents/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: documentUrl }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.details || errorData.error || "Failed to load document"
          );
        }

        const result = await response.json();

        if (result.success && result.data) {
          setDocumentContent(result.data.content);
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (err) {
        console.error("Error loading document:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load document"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [documentUrl, documentType]);

  // Re-render PDF page when currentPage or zoom changes
  useEffect(() => {
    if (pdfDocument && documentType === "pdf" && viewMode === 'visual') {
      renderPage(pdfDocument, currentPage);
    }
  }, [currentPage, zoom, rotation, pdfDocument, viewMode]);

  const renderPage = async (pdf: any, pageNumber: number) => {
    if (!canvasRef.current || !pdf) return;

    try {
      const page = await pdf.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) return;

      // Calculate scale based on zoom and rotation
      const scale = zoom / 100;
      let viewport = page.getViewport({ scale, rotation });

      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Render text layer for selection
      if (textLayerRef.current) {
        textLayerRef.current.innerHTML = "";

        try {
          const textContent = await page.getTextContent();

          // Create text layer container
          const textLayer = document.createElement("div");
          textLayer.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            width: ${viewport.width}px;
            height: ${viewport.height}px;
            overflow: hidden;
            opacity: 0;
            line-height: 1.0;
            user-select: text;
            pointer-events: auto;
          `;

          // Add text items
          textContent.items.forEach((textItem: any) => {
            if (textItem.str) {
              const textDiv = document.createElement("div");
              textDiv.textContent = textItem.str;
              textDiv.style.cssText = `
                position: absolute;
                left: ${textItem.transform[4]}px;
                top: ${viewport.height - textItem.transform[5]}px;
                font-size: ${textItem.height}px;
                font-family: ${textItem.fontName || "sans-serif"};
                transform: scaleX(${textItem.transform[0] / textItem.height});
                transform-origin: 0% 0%;
                white-space: nowrap;
                pointer-events: auto;
              `;
              textLayer.appendChild(textDiv);
            }
          });

          textLayerRef.current.appendChild(textLayer);
        } catch (textError) {
          console.warn("Could not render text layer:", textError);
        }
      }
    } catch (err) {
      console.error("Error rendering page:", err);
      setError(`Error rendering page ${pageNumber}: ${err.message}`);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFullscreen = () => {
    if (!isFullscreen) {
      viewerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleTextSelection = () => {
    if (!onTextSelection) return;

    const selection = window.getSelection();
    if (
      selection &&
      selection.toString().trim() &&
      containerRef.current?.contains(selection.anchorNode)
    ) {
      onTextSelection(selection.toString());
    }
  };

  const handlePrint = () => {
    if (documentType === "excel" || documentType === "google-sheet") {
      // For Excel/Google Sheets, try to trigger print from iframe
      try {
        iframeRef.current?.contentWindow?.print();
      } catch {
        window.print();
      }
    } else {
      window.print();
    }
  };

  const handleDownload = () => {
    if (documentUrl) {
      const link = document.createElement("a");
      link.href = documentUrl;
      link.download = documentUrl.split("/").pop() || "document";
      link.click();
    }
  };

  const getExcelViewUrl = (url: string) => {
    // For Excel files, use Microsoft Office Online viewer
    if (documentType === "excel") {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        url
      )}`;
    }
    // For Google Sheets, modify URL for embedding
    if (documentType === "google-sheet") {
      return url.replace("/edit", "/edit?usp=sharing&output=html&widget=true");
    }
    return url;
  };

  const renderDocumentContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading document...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-600 max-w-md p-6">
            <FileText className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">
              Error Loading Document
            </h3>
            <p className="text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      );
    }

    switch (documentType) {
      case "pdf":
        // For PDF, we can show both visual and text view
        if (viewMode === 'text') {
          return (
            <div
              ref={containerRef}
              className="w-full h-full overflow-auto bg-white p-6"
              onMouseUp={handleTextSelection}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top left",
              }}
            >
              <div className="prose max-w-none select-text">
                {documentContent ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                    {documentContent}
                  </pre>
                ) : (
                  <p className="text-gray-500">No text content available</p>
                )}
              </div>
            </div>
          );
        }
        
        // Visual PDF view
        return (
          <div className="w-full h-full overflow-auto bg-gray-100 flex justify-center py-4">
            <div
              className="relative"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <canvas
                ref={canvasRef}
                className="shadow-lg bg-white cursor-text"
                onMouseUp={handleTextSelection}
              />
              <div
                ref={textLayerRef}
                className="absolute inset-0"
                onMouseUp={handleTextSelection}
              />
            </div>
          </div>
        );

      case "excel":
      case "google-sheet":
        return (
          <div className="w-full h-full overflow-hidden">
            <iframe
              ref={iframeRef}
              src={getExcelViewUrl(documentUrl)}
              className="w-full h-full border-0"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top left",
                width: `${10000 / zoom}%`,
                height: `${10000 / zoom}%`,
              }}
              title="Document Viewer"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </div>
        );

      case "word":
      case "google-doc":
      case "text":
        return (
          <div
            ref={containerRef}
            className="w-full h-full overflow-auto bg-white p-6"
            onMouseUp={handleTextSelection}
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: "top left",
            }}
          >
            <div className="prose max-w-none select-text">
              {documentContent ? (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                  {documentContent}
                </pre>
              ) : (
                <p className="text-gray-500">No content available</p>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-600">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Unsupported document type: {documentType}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      ref={viewerRef}
      className="flex flex-col h-screen overflow-auto bg-gradient-to-br from-gray-50 to-white relative"
    >
      {/* Toolbar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[60px] text-center bg-gray-100 px-3 py-1 rounded-md">
              {zoom}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetZoom}>
              Fit
            </Button>
          </div>

          {/* PDF-specific controls */}
          {documentType === "pdf" && (
            <div className="flex items-center space-x-3">
              {/* View mode toggle for PDF */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
                <Button
                  variant={viewMode === 'visual' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('visual')}
                  className="px-2 py-1 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Visual
                </Button>
                <Button
                  variant={viewMode === 'text' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('text')}
                  className="px-2 py-1 text-xs"
                >
                  <FileType className="h-3 w-3 mr-1" />
                  Text
                </Button>
              </div>
              
              {/* Page navigation - only show in visual mode */}
              {viewMode === 'visual' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-md">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            {documentType !== "excel" && documentType !== "google-sheet" && (
              <Button variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleFullscreen}>
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 relative overflow-hidden">
        <div className="h-full">{renderDocumentContent()}</div>
      </div>

      {/* Selected Text Indicator */}
      {selectedText && (
        <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-md shadow-lg text-sm max-w-xs">
          <p className="truncate">Selected: {selectedText}</p>
        </div>
      )}

    
    </div>
  );
}