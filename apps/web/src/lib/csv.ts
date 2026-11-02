/**
 * CSV is not an OOXML container, so the workbook engine cannot open it
 * directly. Convert it to an XLSX workbook in the browser before handing it to
 * the editor; both the import and export stay local.
 */
interface CsvCellLike {
  anchor: { kind?: string; a1?: string };
  value:
    | { kind: 'empty' }
    | { kind: 'number'; value: number }
    | { kind: 'text'; value: string }
    | { kind: 'bool'; value: boolean }
    | { kind: 'error'; value: string }
    | { kind: 'unavailable'; reason: string };
  displayText: string;
}

interface CsvSheetLike {
  usedRange: string | null;
  cells: readonly CsvCellLike[];
}

function parseA1(a1: string): { row: number; col: number } | null {
  const match = /^([A-Za-z]+)(\d+)$/.exec(a1.trim());
  if (!match) return null;
  const letters = match[1]!.toUpperCase();
  let col = 0;
  for (const letter of letters) col = col * 26 + (letter.charCodeAt(0) - 64);
  return { row: Number(match[2]) - 1, col: col - 1 };
}

function csvValue(cell: CsvCellLike): string {
  switch (cell.value.kind) {
    case 'number':
      return Number.isFinite(cell.value.value) ? String(cell.value.value) : cell.displayText;
    case 'text':
      return cell.value.value;
    case 'bool':
      return cell.value.value ? 'TRUE' : 'FALSE';
    case 'error':
      return cell.value.value;
    case 'empty':
      return cell.displayText;
    case 'unavailable':
      return cell.displayText;
  }
}

function quoteCsv(value: string): string {
  if (/[",\r\n]/.test(value) || /^\s|\s$/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Converts the engine's structured worksheet export to RFC 4180-style CSV.
 * Values are used for numbers and booleans so a CSV stays machine-readable;
 * display formatting is only a fallback.
 */
export function sheetToCsv(sheet: CsvSheetLike): string {
  const located: { row: number; col: number; text: string }[] = [];
  for (const cell of sheet.cells) {
    const a1 = typeof cell.anchor.a1 === 'string' ? cell.anchor.a1 : null;
    const position = a1 ? parseA1(a1) : null;
    if (position) located.push({ ...position, text: csvValue(cell) });
  }

  let maxRow = -1;
  let maxCol = -1;
  for (const cell of located) {
    maxRow = Math.max(maxRow, cell.row);
    maxCol = Math.max(maxCol, cell.col);
  }
  if (sheet.usedRange) {
    const [start, end] = sheet.usedRange.split(':');
    const from = start ? parseA1(start) : null;
    const to = end ? parseA1(end) : from;
    if (to) {
      maxRow = Math.max(maxRow, to.row);
      maxCol = Math.max(maxCol, to.col);
    }
  }
  if (maxRow < 0 || maxCol < 0) return '';

  const grid: string[][] = Array.from({ length: maxRow + 1 }, () => Array<string>(maxCol + 1).fill(''));
  for (const cell of located) {
    const row = grid[cell.row];
    if (row) row[cell.col] = cell.text;
  }
  return `${grid.map((row) => row.map(quoteCsv).join(',')).join('\r\n')}\r\n`;
}

export async function csvBytesToXlsx(bytes: Uint8Array): Promise<Uint8Array> {
  const XLSX = await import('xlsx');
  const text = new TextDecoder('utf-8').decode(bytes);
  const workbook = XLSX.read(text, { type: 'string', raw: false });
  const sheetName = workbook.SheetNames[0] ?? 'Sheet1';
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error('The CSV file did not contain a worksheet.');
  // A CSV has one table; remove any extra empty sheets the parser guessed.
  for (const name of workbook.SheetNames) {
    if (name !== sheetName) delete workbook.Sheets[name];
  }
  workbook.SheetNames = [sheetName];
  return new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }));
}
