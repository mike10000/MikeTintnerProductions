import { PDFDocument, StandardFonts } from "pdf-lib";

const MARGIN = 72;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const FONT_SIZE = 12;
const LINE_HEIGHT = 16;
/** Approx chars per line for Helvetica 12pt (avoids widthOfTextAtSize which can fail in some bundlers) */
const CHARS_PER_LINE = 70;

/** Fixed Y positions for signature block (from bottom of page) - ensures consistent placement */
export const SIG_LABEL_Y = 115;
export const SIG_LINE_Y = 95;
export const DATE_LABEL_Y = 75;
export const DATE_LINE_Y = 55;

/** Sanitize text for PDF Standard fonts (Helvetica) - replace Unicode that can't be encoded */
function sanitizeForPdf(text: string): string {
  return text
    .replace(/[\u201C\u201D]/g, '"')  // smart double quotes
    .replace(/[\u2018\u2019]/g, "'")  // smart single quotes
    .replace(/[\u2013\u2014]/g, "-")  // en/em dash
    .replace(/\u00A0/g, " ");         // non-breaking space
}

/** Strip the signature block from template content (underscore lines, "Client Signature", "Date") */
function stripSignatureBlock(text: string): string {
  const match = text.match(/\n_{5,}\s*\n/);
  if (match && match.index !== undefined) {
    return text.slice(0, match.index).trim();
  }
  return text.trim();
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

/** Add signature block at fixed position from bottom of page */
function addSignatureBlock(
  page: ReturnType<PDFDocument["getPages"]>[0],
  font: ReturnType<PDFDocument["embedStandardFont"]>
) {
  page.drawText("Client Signature", {
    x: MARGIN,
    y: SIG_LABEL_Y,
    size: FONT_SIZE,
    font,
  });
  page.drawText("___________________________", {
    x: MARGIN,
    y: SIG_LINE_Y,
    size: FONT_SIZE,
    font,
  });
  page.drawText("Date", {
    x: MARGIN,
    y: DATE_LABEL_Y,
    size: FONT_SIZE,
    font,
  });
  page.drawText("___________________________", {
    x: MARGIN,
    y: DATE_LINE_Y,
    size: FONT_SIZE,
    font,
  });
}

export async function createPdfFromText(text: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = pdfDoc.embedStandardFont(StandardFonts.Helvetica);

  const contentWithoutSig = stripSignatureBlock(text);
  const sanitized = sanitizeForPdf(contentWithoutSig);
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

  // Ensure last page has room for signature block (need ~120pt from bottom)
  const SIG_BLOCK_MIN_Y = 130;
  if (y < SIG_BLOCK_MIN_Y) {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  }

  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  addSignatureBlock(lastPage, font);

  return pdfDoc.save();
}
