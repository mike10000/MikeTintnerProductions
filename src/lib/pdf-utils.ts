import { PDFDocument, StandardFonts } from "pdf-lib";

const MARGIN = 72;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FONT_SIZE = 12;
const LINE_HEIGHT = 16;

export async function createPdfFromText(text: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const lines = text.split("\n");
  let y = PAGE_HEIGHT - MARGIN;
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  for (const line of lines) {
    if (y < MARGIN + LINE_HEIGHT) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }

    const words = line.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, FONT_SIZE);

      if (width > CONTENT_WIDTH && currentLine) {
        page.drawText(currentLine, {
          x: MARGIN,
          y,
          size: FONT_SIZE,
          font,
        });
        y -= LINE_HEIGHT;
        currentLine = word;

        if (y < MARGIN + LINE_HEIGHT) {
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          y = PAGE_HEIGHT - MARGIN;
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      page.drawText(currentLine, {
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
