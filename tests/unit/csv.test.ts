import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { csvBytesToXlsx, sheetToCsv } from '../../apps/web/src/lib/csv';

type Cell = {
  anchor: { kind?: string; a1?: string };
  value:
    | { kind: 'empty' }
    | { kind: 'number'; value: number }
    | { kind: 'text'; value: string }
    | { kind: 'bool'; value: boolean }
    | { kind: 'error'; value: string }
    | { kind: 'unavailable'; reason: string };
  displayText: string;
};

function cell(a1: string, value: Cell['value'], displayText = ''): Cell {
  return { anchor: { kind: 'cell', a1 }, value, displayText };
}

function sheet(cells: Cell[], usedRange: string | null = null) {
  return { usedRange, cells };
}

describe('sheetToCsv', () => {
  it('writes values, escapes quotes and quotes leading/trailing spaces', () => {
    const csv = sheetToCsv(
      sheet(
        [
          cell('A1', { kind: 'text', value: 'Item' }),
          cell('B1', { kind: 'text', value: 'Qty' }),
          cell('A2', { kind: 'text', value: 'Pen, blue' }),
          cell('B2', { kind: 'number', value: 2 }),
          cell('A3', { kind: 'text', value: 'Say "hi"' }),
          cell('B3', { kind: 'bool', value: true }),
          cell('A4', { kind: 'text', value: ' padded ' }),
        ],
        'A1:B4',
      ),
    );
    expect(csv).toBe(
      ['Item,Qty', '"Pen, blue",2', '"Say ""hi""",TRUE', '" padded ",'].join('\r\n') + '\r\n',
    );
  });

  it('uses display text for empty, error and unavailable values', () => {
    const csv = sheetToCsv(
      sheet(
        [
          cell('A1', { kind: 'empty' }, ''),
          cell('A2', { kind: 'error', value: '#DIV/0!' }, '#DIV/0!'),
          cell('A3', { kind: 'unavailable', reason: 'not JSON' }, 'n/a'),
          cell('A4', { kind: 'number', value: Number.NaN }, 'not-a-number'),
        ],
        'A1:A4',
      ),
    );
    expect(csv).toBe(['', '#DIV/0!', 'n/a', 'not-a-number'].join('\r\n') + '\r\n');
  });

  it('returns an empty string when there is nothing to export', () => {
    expect(sheetToCsv(sheet([]))).toBe('');
    expect(sheetToCsv(sheet([{ anchor: { kind: 'sheet' }, value: { kind: 'empty' }, displayText: '' }]))).toBe('');
  });

  it('honours the used range even when cells at the edge are absent', () => {
    const csv = sheetToCsv(sheet([cell('A2', { kind: 'text', value: 'value' })], 'A1:A2'));
    expect(csv).toBe('\r\nvalue\r\n');
  });
});

describe('csvBytesToXlsx', () => {
  it('converts one CSV table into a single-sheet workbook', async () => {
    const source = new TextEncoder().encode('Item,Qty\n"Pen, blue",2\n');
    const bytes = await csvBytesToXlsx(source);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);

    const workbook = XLSX.read(bytes, { type: 'array' });
    expect(workbook.SheetNames).toHaveLength(1);
    const first = workbook.Sheets[workbook.SheetNames[0]!]!;
    expect(first.A1?.v).toBe('Item');
    expect(first.B2?.v).toBe(2);
  });
});
