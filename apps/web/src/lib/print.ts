import type { XlsxAsyncEditorApi } from '@betteroffice/xlsx-react';
import { paintDisplayList } from '@betteroffice/xlsx';
import type { PptxAsyncEditorApi } from '@betteroffice/pptx-react';
import { paintSlide, sizeCanvasForSlide } from '@betteroffice/pptx';
import { toastInfo } from '../stores/toast-store';

const PRINT_STYLE = `
  @page { margin: 12mm; }
  html, body { margin: 0; padding: 0; background: #fff; color: #111; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  h1 { font-size: 16px; margin: 0 0 10px; }
  h2 { font-size: 13px; margin: 16px 0 8px; color: #475569; }
  img.sheet, img.slide { display: block; max-width: 100%; height: auto; margin: 0 auto 18px; }
  img.slide { page-break-after: always; }
  .note { font-size: 11px; color: #64748b; margin-top: 6px; }
`;

function printableFrame(inner: string, title: string): void {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  frame.title = title;
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    toastInfo('Printing is unavailable', 'The browser blocked the print frame.');
    return;
  }
  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${title.replace(/[<>&]/g, '')}</title><style>${PRINT_STYLE}</style></head><body>${inner}</body></html>`,
  );
  doc.close();

  const cleanup = () => window.setTimeout(() => frame.remove(), 1000);
  frame.contentWindow?.addEventListener('afterprint', cleanup, { once: true });
  window.setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => frame.remove(), 60_000);
  }, 250);
}

function canvasDataUrl(canvas: HTMLCanvasElement, maxWidth: number): string {
  if (canvas.width <= maxWidth) return canvas.toDataURL('image/png');
  const scaled = document.createElement('canvas');
  const ratio = maxWidth / canvas.width;
  scaled.width = maxWidth;
  scaled.height = Math.round(canvas.height * ratio);
  const ctx = scaled.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/png');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, scaled.width, scaled.height);
  ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
  return scaled.toDataURL('image/png');
}

const SHEET_METRICS = {
  dpi: 96,
  maxDigitWidth: 7,
  defaultRowHeightPt: 15,
  defaultColumnWidth: 8.43,
  fontSizePt: 11,
  fontFamily: 'Calibri',
  fontAscent: 0.75,
  fontDescent: 0.25,
} as const;

/**
 * Prints every visible worksheet through the engine's own display list. This
 * preserves fills, fonts, borders and number formatting; very large sheets are
 * clipped by the engine's cell budget and the export reports that honestly.
 */
export async function printSheets(api: XlsxAsyncEditorApi, fileName: string): Promise<void> {
  const exported = await api.exportStructured({ includeHiddenSheets: false, maxCells: 200_000 });
  if (!exported.ok) {
    throw new Error(exported.failure.message);
  }
  const sheets = exported.content.sheets.filter((sheet) => sheet.kind === 'worksheet' && sheet.visibility === 'visible');
  const images: string[] = [];
  for (const sheet of sheets) {
    const anchor = sheet.anchor;
    const identity =
      anchor.kind === 'definedName'
        ? anchor.localSheet
        : anchor.kind === 'sourcePart'
          ? null
          : anchor.sheet;
    if (!identity) continue;
    const range = sheet.usedRange ?? 'A1';
    const display = await api.printDisplayList(identity.index, range, { ...SHEET_METRICS }, false);
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 2400 / Math.max(display.width, 1));
    canvas.width = Math.max(1, Math.round(display.width * scale));
    canvas.height = Math.max(1, Math.round(display.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (scale === 1) {
      paintDisplayList(ctx, display, 1);
    } else {
      ctx.save();
      ctx.scale(scale, scale);
      paintDisplayList(ctx, display, 1);
      ctx.restore();
    }
    images.push(
      `<section><h2>${escapeHtml(identity.name)}</h2><img class="sheet" alt="" src="${canvasDataUrl(canvas, 2000)}" /></section>`,
    );
  }
  if (images.length === 0) throw new Error('This workbook has no printable worksheet.');
  printableFrame(
    `<h1>${escapeHtml(fileName)}</h1>${images.join('')}<p class="note">Rendered locally by Wepo. Very large sheets may be clipped.</p>`,
    fileName,
  );
}

/**
 * Prints slides by repainting each engine display list into a PNG. Images are
 * omitted by the engine's print path; PPTX export preserves them.
 */
export async function printSlides(api: PptxAsyncEditorApi, fileName: string): Promise<void> {
  const access = await api.handleAsync();
  const snapshot = await access.snapshot();
  const images: string[] = [];
  for (let index = 0; index < snapshot.slides.length; index += 1) {
    const display = await access.layoutSlide(index);
    const canvas = document.createElement('canvas');
    sizeCanvasForSlide(canvas, display, 1);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await paintSlide(ctx, display, 1);
    images.push(`<img class="slide" alt="Slide ${index + 1}" src="${canvasDataUrl(canvas, 1800)}" />`);
  }
  if (images.length === 0) throw new Error('This presentation has no printable slides.');
  printableFrame(
    `<h1>${escapeHtml(fileName)}</h1>${images.join('')}<p class="note">Rendered locally by Wepo. Pictures are not included in this print path; export PPTX to keep them.</p>`,
    fileName,
  );
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}
