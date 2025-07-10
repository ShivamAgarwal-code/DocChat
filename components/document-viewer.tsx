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
  Lightbulb,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { TextSelectionPopover } from "./text-selection-popover";

interface DocumentViewerProps {
  documentUrl: string;
  documentType: string;
  onTextSelection: (text: string) => void;
  selectedText: string;
  onTextAction: (action: "summarize" | "explain", text: string) => void;
  documentData?: string; // Full document content for AI processing
}

export function DocumentViewer({
  documentUrl,
  documentType,
  onTextSelection,
  selectedText,
  onTextAction,
  documentData,
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectionPosition, setSelectionPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 25, 300);
    setZoom(newZoom);
    updateIframeZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 25, 25);
    setZoom(newZoom);
    updateIframeZoom(newZoom);
  };

  const handleResetZoom = () => {
    setZoom(100);
    updateIframeZoom(100);
  };

  const updateIframeZoom = (zoomLevel: number) => {
    if (iframeRef.current && documentType === "pdf") {
      const iframe = iframeRef.current;
      iframe.src = `${documentUrl}#zoom=${zoomLevel}&page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0`;
    }
  };

  const handleFullscreen = () => {
    if (!isFullscreen) {
      viewerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handlePrint = () => {
    // Create a new window with the document for printing
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      if (documentType === "pdf") {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Document</title>
              <style>
                body { margin: 0; padding: 0; }
                iframe { width: 100%; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              <iframe src="${documentUrl}" onload="window.print(); window.close();"></iframe>
            </body>
          </html>
        `);
      } else {
        // For other document types, use the document data or URL
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Document</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                pre { white-space: pre-wrap; word-wrap: break-word; }
              </style>
            </head>
            <body>
              ${
                documentData
                  ? `<pre>${documentData}</pre>`
                  : `<iframe src="${documentUrl}" style="width:100%; height:90vh; border:none;"></iframe>`
              }
              <script>window.print(); window.close();</script>
            </body>
          </html>
        `);
      }
      printWindow.document.close();
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from URL or use default
      const urlParts = documentUrl.split("/");
      const filename =
        urlParts[urlParts.length - 1].split("?")[0] || "document.pdf";
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback to opening in new tab
      window.open(documentUrl, "_blank");
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleTextSelectionInDocument = () => {
    const selection = window.getSelection();

    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Position the popover relative to the viewer container
      const viewerRect = viewerRef.current?.getBoundingClientRect();
      if (viewerRect) {
        setSelectionPosition({
          x: rect.left - viewerRect.left + rect.width / 2,
          y: rect.top - viewerRect.top - 10,
        });
      }

      onTextSelection(text);
    } else {
      setSelectionPosition(null);
      onTextSelection("");
    }
  };

  const handleTextAction = async (action: "summarize" | "explain") => {
    if (!selectedText) return;

    setIsProcessing(true);
    try {
      await onTextAction(action, selectedText);
    } finally {
      setIsProcessing(false);
      // Clear selection after action
      setSelectionPosition(null);
      onTextSelection("");
    }
  };

  const handleCloseSelection = () => {
    setSelectionPosition(null);
    onTextSelection("");
    // Clear browser selection
    window.getSelection()?.removeAllRanges();
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleTextSelectionInDocument);
    return () => {
      document.removeEventListener("mouseup", handleTextSelectionInDocument);
    };
  }, []);

  const renderDocumentViewer = () => {
    if (documentType === "pdf") {
      return (
        <iframe
          ref={iframeRef}
          src={`${documentUrl}#zoom=${zoom}&page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0`}
          className="w-full h-full border-0 overflow-auto rounded-lg scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "center center",
          }}
          title="PDF Viewer"
        />
      );
    }

    if (documentType === "word") {
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
        documentUrl
      )}&embedded=true`;

      return (
        <iframe
          src={googleViewerUrl}
          className="w-full h-full rounded-lg"
          title="Word Viewer"
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: "center center",
          }}
        />
      );
    }

    // For text content or other document types
    if (documentData) {
      return (
        <div
          className="w-full h-full p-6 overflow-auto bg-white rounded-lg"
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: "top left",
            fontSize: `${zoom / 100}rem`,
          }}
        >
          <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
            {documentData}
          </pre>
        </div>
      );
    }

    // Fallback for unknown types
    return (
      <div className="flex items-center justify-center overflow-hidden h-full bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg">
            <svg
              className="w-10 h-10 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Document Viewer
          </h3>
          <p className="text-gray-600 mb-6">
            Viewing: {documentType.toUpperCase()}
          </p>
          <Button
            onClick={() => window.open(documentUrl, "_blank")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Open in New Tab
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={viewerRef}
      className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white relative"
    >
      {/* Toolbar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              className="bg-white/50 hover:bg-white/80"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[60px] text-center bg-gray-100 px-3 py-1 rounded-md">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              className="bg-white/50 hover:bg-white/80"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
              className="bg-white/50 hover:bg-white/80"
            >
              Fit
            </Button>
          </div>

          <div className="hidden lg:flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className="bg-white/50 hover:bg-white/80"
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
              className="bg-white/50 hover:bg-white/80"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="hidden lg:flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="bg-white/50 hover:bg-white/80"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="bg-white/50 hover:bg-white/80"
            >
              <Printer className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="bg-white/50 hover:bg-white/80"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFullscreen}
              className="bg-white/50 hover:bg-white/80"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex lg:hidden items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="bg-white/50 hover:bg-white/80"
            >
              <Printer className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleFullscreen}
              className="bg-white/50 hover:bg-white/80"
            >
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
      <div className="flex-1 relative overflow-hidden p-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden max-sm:h-[40vh] h-full">
          {renderDocumentViewer()}
        </div>

        {/* Text Selection Popover */}
        {selectedText && selectionPosition && (
          <TextSelectionPopover
            position={selectionPosition}
            selectedText={selectedText}
            onClose={handleCloseSelection}
          />
        )}
      </div>
    </div>
  );
}
