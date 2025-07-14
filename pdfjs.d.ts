// pdfjs.d.ts
declare module 'pdfjs-dist/build/pdf' {
  const pdfjsLib: any;
  export = pdfjsLib;
}

declare module 'pdfjs-dist/build/pdf.worker.entry' {
  const worker: any;
  export = worker;
}

declare module 'pdfjs-dist/legacy/build/pdf.worker.entry' {
  const workerSrc: string;
  export default workerSrc;
}