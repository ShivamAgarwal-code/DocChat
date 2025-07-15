// lib/pdfWorker.ts
import { GlobalWorkerOptions } from "pdfjs-dist/build/pdf"
import workerSrc from "pdfjs-dist/build/pdf.worker.entry"

GlobalWorkerOptions.workerSrc = workerSrc
