/**
 * Generates the blank templates shipped with the app and the real Office files
 * used by the browser tests. Run after `npm install`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const templates = join(root, 'apps', 'web', 'public', 'templates');
const samples = join(root, 'apps', 'web', 'public', 'samples');
mkdirSync(templates, { recursive: true });
mkdirSync(samples, { recursive: true });

// 8x8 blue rounded square, used to prove images survive a DOCX round trip.
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAJUlEQVR42mNkYPjPwMDAwMDAxMDAwMDAxMDAwMDAxMDAwMAAAJ0ABQEB9p8WAAAAAElFTkSuQmCC';

function docxBytes({ blank }) {
  const children = blank
    ? [new Paragraph({ children: [new TextRun({ text: '', size: 24 })] })]
    : [
        new Paragraph({ text: 'Wepo Office sample', heading: HeadingLevel.TITLE }),
        new Paragraph({
          children: [
            new TextRun({ text: 'This document was generated for round-trip testing. ', size: 24 }),
            new TextRun({ text: 'Bold text', bold: true, size: 24 }),
            new TextRun({ text: ', ' }),
            new TextRun({ text: 'italic text', italics: true, size: 24 }),
            new TextRun({ text: ' and ' }),
            new TextRun({ text: 'underlined text', underline: {}, size: 24 }),
            new TextRun({ text: '.' }),
          ],
        }),
        new Paragraph({ text: 'A short heading', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: 'First bullet', bullet: { level: 0 } }),
        new Paragraph({ text: 'Second bullet', bullet: { level: 0 } }),
        new Paragraph({ text: 'A table follows.' }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Item', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Amount', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true })] })] }),
              ],
            }),
            ...['Design', 'Build', 'Test'].map(
              (item, index) =>
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(item)] }),
                    new TableCell({ children: [new Paragraph(String((index + 1) * 1250))] }),
                    new TableCell({ children: [new Paragraph(index === 1 ? 'In progress' : 'Done')] }),
                  ],
                }),
            ),
          ],
        }),
        new Paragraph({
          children: [
            new ImageRun({
              data: Buffer.from(PNG, 'base64'),
              transformation: { width: 32, height: 32 },
              type: 'png',
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ];
  return Packer.toBuffer(
    new Document({
      creator: 'Wepo Office',
      title: blank ? 'Blank document' : 'Wepo Office sample',
      sections: [{ properties: {}, children }],
    }),
  );
}

function xlsxBytes({ blank }) {
  const workbook = XLSX.utils.book_new();
  if (blank) {
    const sheet = XLSX.utils.aoa_to_sheet([['']]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
  } else {
    const data = [
      ['Wepo Office sample workbook', '', '', '', '', '', ''],
      [],
      ['Item', 'Q1', 'Q2', 'Q3', 'Q4', 'Total', 'Average'],
      ['Design', 1200, 1500, 1800, 2100, null, null],
      ['Build', 2400, 2600, 2500, 2800, null, null],
      ['Test', 900, 1100, 1300, 1500, null, null],
      ['Support', 600, 700, 800, 900, null, null],
      [],
      ['Grand total', null, null, null, null, null, null],
      ['Highest quarter', null, null, null, null, null, null],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    for (let row = 3; row <= 6; row += 1) {
      sheet[`F${row + 1}`] = { t: 'n', f: `SUM(B${row + 1}:E${row + 1})` };
      sheet[`G${row + 1}`] = { t: 'n', f: `AVERAGE(B${row + 1}:E${row + 1})` };
    }
    sheet.F9 = { t: 'n', f: 'SUM(F4:F7)' };
    sheet.B10 = { t: 'n', f: 'MAX(B4:E7)' };
    sheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
    sheet['!cols'] = [
      { wch: 18 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Budget');
    const notes = XLSX.utils.aoa_to_sheet([
      ['Notes'],
      ['Every number is a plain value.'],
      ['The Budget sheet stores live SUM, AVERAGE, MAX formulas.'],
    ]);
    XLSX.utils.book_append_sheet(workbook, notes, 'Notes');
  }
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

async function pptxBytes({ blank }) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Wepo Office';
  pptx.title = blank ? 'Blank presentation' : 'Wepo Office sample';
  if (blank) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addText('Click to add a title', {
      x: 0.8,
      y: 2.2,
      w: 11.7,
      h: 1.1,
      fontSize: 34,
      color: '94A3B8',
      align: 'center',
    });
  } else {
    const cover = pptx.addSlide();
    cover.background = { color: '0F172A' };
    cover.addText('Wepo Office', {
      x: 0.9,
      y: 1.6,
      w: 11.5,
      h: 1.1,
      fontSize: 48,
      bold: true,
      color: 'FFFFFF',
    });
    cover.addText('A private office suite that runs in your browser', {
      x: 0.9,
      y: 2.9,
      w: 11.5,
      h: 0.7,
      fontSize: 22,
      color: 'CBD5E1',
    });
    cover.addShape('rect', { x: 0.9, y: 4.2, w: 3.2, h: 0.12, fill: { color: '3B82F6' } });

    const agenda = pptx.addSlide();
    agenda.addText('What is inside', {
      x: 0.8,
      y: 0.6,
      w: 11.7,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: '0F172A',
    });
    agenda.addText(
      [
        { text: 'Word: DOCX editing with tables and images\n', options: { bullet: true } },
        { text: 'Sheets: XLSX formulas calculated locally\n', options: { bullet: true } },
        { text: 'Slides: PPTX decks and full-screen presenting\n', options: { bullet: true } },
        { text: 'Every file stays on the device\n', options: { bullet: true } },
      ],
      { x: 1.1, y: 1.7, w: 11, h: 3.8, fontSize: 20, color: '334155', lineSpacing: 34 },
    );

    const table = pptx.addSlide();
    table.addText('Round-trip checklist', {
      x: 0.8,
      y: 0.6,
      w: 11.7,
      h: 0.8,
      fontSize: 30,
      bold: true,
      color: '0F172A',
    });
    table.addTable(
      [
        [
          { text: 'Feature', options: { bold: true } },
          { text: 'Expected', options: { bold: true } },
        ],
        [{ text: 'Slides' }, { text: '3 slides preserved' }],
        [{ text: 'Text' }, { text: 'Runs, sizes and colours preserved' }],
        [{ text: 'Shapes' }, { text: 'Rectangles and tables preserved' }],
      ],
      { x: 0.9, y: 1.7, w: 11.2, colW: [4.2, 7], fontSize: 18, border: { type: 'solid', color: 'E2E8F0' } },
    );
    const image = pptx.addSlide();
    image.addText('Images and shapes', {
      x: 0.8,
      y: 0.6,
      w: 11.7,
      h: 0.8,
      fontSize: 30,
      bold: true,
      color: '0F172A',
    });
    image.addShape('roundRect', {
      x: 1.1,
      y: 1.9,
      w: 3.4,
      h: 2.6,
      fill: { color: 'DBEAFE' },
      line: { color: '2563EB', width: 1.5 },
    });
    image.addText('Blue rounded rectangle', {
      x: 1.3,
      y: 3.0,
      w: 3,
      h: 0.6,
      fontSize: 16,
      color: '1D4ED8',
      align: 'center',
    });
    image.addImage({ data: `data:image/png;base64,${PNG}`, x: 6, y: 2.2, w: 2.4, h: 2.4 });
  }
  return pptx.write({ outputType: 'nodebuffer' });
}

const docxTemplate = await docxBytes({ blank: true });
const xlsxTemplate = xlsxBytes({ blank: true });
const pptxTemplate = await pptxBytes({ blank: true });
writeFileSync(join(templates, 'blank.docx'), docxTemplate);
writeFileSync(join(templates, 'blank.xlsx'), xlsxTemplate);
writeFileSync(join(templates, 'blank.pptx'), pptxTemplate);

const docxSample = await docxBytes({ blank: false });
const xlsxSample = xlsxBytes({ blank: false });
const pptxSample = await pptxBytes({ blank: false });
writeFileSync(join(samples, 'sample.docx'), docxSample);
writeFileSync(join(samples, 'sample.xlsx'), xlsxSample);
writeFileSync(join(samples, 'sample.pptx'), pptxSample);

console.log('[samples] wrote blank templates and round-trip samples');
