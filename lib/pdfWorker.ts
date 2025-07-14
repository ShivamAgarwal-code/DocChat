// lib/pdfWorker.ts
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist/legacy/build/pdf';
import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.entry';

GlobalWorkerOptions.workerSrc = workerSrc
