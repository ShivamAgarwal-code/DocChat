// SmartDocumentViewer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import axios from "axios";

import "@/lib/pdfWorker" // Load worker first


interface SmartDocumentViewerProps {
  documentUrl: string;
  zoom?: number;
  rotation?: number;
  pageNumber?: number;
  onLoaded?: (doc: PDFDocumentProxy) => void;
}

export function SmartDocumentViewer({
  documentUrl,
  zoom = 100,
  rotation = 0,
  pageNumber = 1,
  onLoaded,
}: SmartDocumentViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [fallbackIframe, setFallbackIframe] = useState<string | null>(null);

  const getProxiedUrl = (url: string) =>
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

  useEffect(() => {
    const loadDocument = async () => {
      try {
        if (!documentUrl) return;

        const isPdf = /\.pdf(\?.*)?$/i.test(documentUrl);
        const isWord = /\.(docx?|odt)(\?.*)?$/i.test(documentUrl);
        const isGoogleDoc = /docs\.google\.com\/document\/d\//.test(documentUrl);

        // Handle Word: Use Google Docs Viewer
        if (isWord) {
          const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
            documentUrl
          )}&embedded=true`;
          setFallbackIframe(viewerUrl);
          return;
        }

        // Handle Google Docs
        if (isGoogleDoc) {
          const match = documentUrl.match(/\/d\/([^/]+)/);
          const docId = match?.[1];
          if (!docId) throw new Error("Invalid Google Docs URL");
          const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;

          const response = await axios.get(exportUrl);
          setHtmlContent(response.data);
          setIsPdf(false);
          return;
        }

        // If PDF, try via CORS proxy
        if (isPdf) {
          const proxiedUrl = getProxiedUrl(documentUrl);

          const response = await axios.get(proxiedUrl, {
            responseType: "arraybuffer",
          });

          const loadingTask = pdfjs.getDocument({ data: response.data });
          const pdf = await loadingTask.promise;
          onLoaded?.(pdf);
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: zoom / 100, rotation });

          const canvas = canvasRef.current;
          if (!canvas) return;
          const context = canvas.getContext("2d");
          if (!context) return;

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context, viewport }).promise;
          setIsPdf(true);
          return;
        }

        // For HTML/text files — try to fetch via proxy and render
        const proxiedUrl = getProxiedUrl(documentUrl);
        const response = await axios.get(proxiedUrl);
        setHtmlContent(response.data);
        setIsPdf(false);
      } catch (err) {
        console.error("Failed to load document:", err);
        setFallbackIframe(documentUrl); // fallback iframe if all else fails
      }
    };

    loadDocument();
  }, [documentUrl, zoom, rotation, pageNumber]);

  // Fallback iframe (for Word or failed load)
  if (fallbackIframe) {
    return (
      <iframe
        src={fallbackIframe}
        className="w-full h-full rounded"
        title="Document Viewer"
      />
    );
  }

  if (isPdf) {
    return <canvas ref={canvasRef} className="w-full rounded shadow" />;
  }

  return (
    <div
      className="prose max-w-full overflow-auto p-4 rounded shadow"
      dangerouslySetInnerHTML={{
        __html: htmlContent || "<p>Loading document...</p>",
      }}
    />
  );
}
