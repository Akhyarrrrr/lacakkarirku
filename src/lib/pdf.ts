import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";

function getPdfJsWorkerSrc() {
  return pathToFileURL(
    join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs"),
  ).href;
}

function getPdfParseWorkerSrc() {
  return pathToFileURL(
    join(process.cwd(), "node_modules", "pdf-parse", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs"),
  ).href;
}

function toPdfData(buffer: Buffer) {
  return Uint8Array.from(buffer);
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

async function extractWithPdfParse(buffer: Buffer) {
  PDFParse.setWorker(getPdfParseWorkerSrc());

  const parser = new PDFParse({
    data: toPdfData(buffer),
  });

  try {
    const result = await parser.getText();

    return cleanText(result.text);
  } finally {
    await parser.destroy();
  }
}

async function extractWithPdfJs(buffer: Buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = getPdfJsWorkerSrc();

  const loadingTask = pdfjs.getDocument({
    data: toPdfData(buffer),
    disableFontFace: true,
    isEvalSupported: false,
    useSystemFonts: true,
    useWorkerFetch: false,
  });

  const document = await loadingTask.promise;
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => "str" in item ? item.str : "")
        .join(" ");

      pages.push(pageText);
    }

    return cleanText(pages.join(" "));
  } finally {
    await document.destroy();
  }
}

export async function extractPdfText(buffer: Buffer) {
  const errors: string[] = [];

  for (const extractor of [extractWithPdfJs, extractWithPdfParse]) {
    try {
      const text = await extractor(buffer);
      if (text) return text;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(`Tidak bisa mengekstrak teks PDF. Detail parser: ${errors.join(" | ")}`);
}
