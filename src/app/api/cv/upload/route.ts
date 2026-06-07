import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { parseCVWithAI } from "@/lib/cv-parser";
import { runBatchMatch } from "@/lib/matcher";
import { extractPdfText } from "@/lib/pdf";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log(`[CV Upload] Starting for user: ${userId}`);

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error("[CV Upload] No file found in form data");
      return NextResponse.json({ error: "File tidak ditemukan dalam unggahan." }, { status: 400 });
    }

    console.log(`[CV Upload] File received: ${file.name}, Size: ${file.size}, Type: ${file.type}`);

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB." }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return NextResponse.json({ error: "Hanya file PDF yang diperbolehkan." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log("[CV Upload] Buffer created, starting PDF parse...");

    let text = "";
    try {
      text = await extractPdfText(buffer);
      console.log(`[CV Upload] PDF parsed successfully, text length: ${text.length}`);
    } catch (pdfError: unknown) {
      console.error("[CV Upload] PDF Parse Internal Error:", pdfError);

      return NextResponse.json({ 
        error: "Gagal membaca isi file PDF. Pastikan file PDF Anda tidak terproteksi password atau rusak.",
        details: getErrorMessage(pdfError)
      }, { status: 500 });
    }

    if (!text || text.trim().length === 0) {
      console.error("[CV Upload] Extracted text is empty");
      return NextResponse.json({ error: "Teks tidak ditemukan dalam PDF ini. Pastikan PDF bukan hasil scan gambar (OCR)." }, { status: 400 });
    }

    // Clean text: remove extra whitespace and non-printable characters
    text = text.replace(/\s+/g, ' ').trim();

    console.log("[CV Upload] Sending text to AI for analysis...");
    let parsedData;
    try {
      parsedData = await parseCVWithAI(text, userId);
      console.log("[CV Upload] AI Analysis complete");
    } catch (aiError: unknown) {
      console.error("[CV Upload] AI Analysis Error:", aiError);
      return NextResponse.json({ 
        error: "Gagal menganalisis CV menggunakan AI. Silakan coba lagi dalam beberapa saat.",
        details: getErrorMessage(aiError)
      }, { status: 500 });
    }
    
    // Batch matching
    try {
      console.log("[CV Upload] Starting batch match...");
      await runBatchMatch(userId);
      console.log("[CV Upload] Batch match complete");
    } catch (matchError) {
      console.warn("[CV Upload] Match calculation failed:", matchError);
    }

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: unknown) {
    console.error("[CV Upload] Global Error:", error);
    return NextResponse.json({ 
      error: "Terjadi kesalahan sistem yang tidak terduga saat memproses CV.",
      details: getErrorMessage(error)
    }, { status: 500 });
  }
}
