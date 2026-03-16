import { PDFDocument, StandardFonts } from "pdf-lib";

const MARGIN = 72;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const FONT_SIZE = 12;
const LINE_HEIGHT = 16;
/** Approx chars per line for Helvetica 12pt (avoids widthOfTextAtSize which can fail in some bundlers) */
const CHARS_PER_LINE = 70;

/** Sanitize text for PDF Standard fonts (Helvetica) - replace Unicode that can't be encoded */
function sanitizeForPdf(text: string): string {
  return text
    .replace(/[\u201C\u201D]/g, '"')  // smart double quotes
    .replace(/[\u2018\u2019]/g, "'")  // smart single quotes
    .replace(/[\u2013\u2014]/g, "-")  // en/em dash
    .replace(/\u00A0/g, " ");         // non-breaking space
}

/** Wrap text into lines of ~CHARS_PER_LINE chars (word boundaries) */
function wrapLines(text: string): string[] {
  const lines: string[] = [];
  const words = text.split(" ");
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > CHARS_PER_LINE && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function createPdfFromText(text: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = pdfDoc.embedStandardFont(StandardFonts.Helvetica);

  const sanitized = sanitizeForPdf(text);
  const lines = sanitized.split("\n");
  let y = PAGE_HEIGHT - MARGIN;
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  for (const line of lines) {
    if (y < MARGIN + LINE_HEIGHT) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }

    const wrapped = wrapLines(line);
    for (const wrappedLine of wrapped) {
      if (y < MARGIN + LINE_HEIGHT) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }
      page.drawText(sanitizeForPdf(wrappedLine), {
        x: MARGIN,
        y,
        size: FONT_SIZE,
        font,
      });
      y -= LINE_HEIGHT;
    }
  }

  return pdfDoc.save();
}
