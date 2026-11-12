import { normalizeTxId } from './providers/tsaShamcash';

/**
 * Fast & Bulletproof OCR for ShamCash Receipts
 * Primary: Ultra-fast REST OCR engine (OCR.space, <1s response time, 0 native dependencies)
 * Fallback: Local Tesseract worker with strict 6s timeout protection
 */
export async function recognizeReceipt(imageBuffer: Buffer): Promise<{
  text: string;
  txId: string;
}> {
  let recognizedText = '';
  let candidateTx = '';

  // 1. Primary Engine: Ultra-fast REST OCR (<1000ms, no WASM/Worker issues on Serverless)
  try {
    const base64Data = 'data:image/png;base64,' + imageBuffer.toString('base64');
    const formData = new URLSearchParams();
    formData.append('base64Image', base64Data);
    formData.append('apikey', process.env.OCR_SPACE_API_KEY || 'K88582498888957');
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);

    const res = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const parsed = data?.ParsedResults?.[0]?.ParsedText || '';
      if (parsed.trim()) {
        recognizedText = parsed;
        const digitMatch = parsed.match(/\b([0-9]{7,15})\b/);
        if (digitMatch && digitMatch[1]) {
          candidateTx = digitMatch[1].trim();
        } else {
          candidateTx = normalizeTxId(parsed);
        }
      }
    }
  } catch (err: any) {
    console.warn('[REST OCR Warn]:', err?.message);
  }

  // If REST OCR succeeded, return immediately
  if (candidateTx && candidateTx.length >= 5) {
    return { text: recognizedText, txId: candidateTx };
  }

  // 2. Secondary Engine: Local Tesseract (Strict 6s Race Timeout)
  try {
    const tesseractPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        errorHandler: () => {},
      });
      try {
        const ret = await worker.recognize(imageBuffer);
        return ret?.data?.text || '';
      } finally {
        await worker.terminate().catch(() => {});
      }
    })();

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Tesseract timeout (6s)')), 6000)
    );

    const ocrText = await Promise.race([tesseractPromise, timeoutPromise]);
    if (ocrText && ocrText.trim()) {
      recognizedText = ocrText;
      const digitMatch = ocrText.match(/\b([0-9]{7,15})\b/);
      if (digitMatch && digitMatch[1]) {
        candidateTx = digitMatch[1].trim();
      } else {
        candidateTx = normalizeTxId(ocrText);
      }
    }
  } catch (tessErr: any) {
    console.warn('[Local Tesseract Warn]:', tessErr?.message);
  }

  return { text: recognizedText, txId: candidateTx };
}
