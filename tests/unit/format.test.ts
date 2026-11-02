import { describe, expect, it } from 'vitest';
import {
  buildOutputName,
  describeUnsupported,
  detectFile,
  extensionOf,
  isOpenableForApp,
  isSupportedForApp,
  sanitizeFileName,
  supportsPdfExport,
} from '@wepo/core';

const ZIP_HEAD = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
const OLE_HEAD = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1]);
const PDF_HEAD = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

describe('extensionOf', () => {
  it('lowercases and strips only the final extension', () => {
    expect(extensionOf('Report.FINAL.DOCX')).toBe('docx');
    expect(extensionOf('/tmp/folder/My Sheet.xlsx')).toBe('xlsx');
  });

  it('returns an empty string for files without a useful extension', () => {
    expect(extensionOf('README')).toBe('');
    expect(extensionOf('.env')).toBe('');
    expect(extensionOf('trailing.')).toBe('');
  });
});

describe('detectFile', () => {
  it('maps supported extensions to the right app', () => {
    expect(detectFile('letter.docx')).toMatchObject({ format: 'docx', kind: 'word', zipBased: true });
    expect(detectFile('budget.xlsx')).toMatchObject({ format: 'xlsx', kind: 'sheets', zipBased: true });
    expect(detectFile('export.csv')).toMatchObject({ format: 'csv', kind: 'sheets', zipBased: false });
    expect(detectFile('deck.pptx')).toMatchObject({ format: 'pptx', kind: 'slides', zipBased: true });
  });

  it('recognises legacy and OpenDocument formats so they can be refused clearly', () => {
    expect(detectFile('old.doc')).toMatchObject({ format: 'doc', kind: 'word', zipBased: false });
    expect(detectFile('old.xls')).toMatchObject({ format: 'xls', kind: 'sheets', zipBased: false });
    expect(detectFile('old.ppt')).toMatchObject({ format: 'ppt', kind: 'slides', zipBased: false });
    expect(detectFile('text.odt')).toMatchObject({ format: 'odt', kind: 'word', zipBased: true });
    expect(detectFile('data.ods')).toMatchObject({ format: 'ods', kind: 'sheets', zipBased: true });
  });

  it('marks unknown extensions as having no editor', () => {
    expect(detectFile('archive.zip')).toMatchObject({ format: 'unknown', kind: null });
    expect(detectFile('no-extension')).toMatchObject({ format: 'unknown', kind: null });
  });

  it('accepts matching ZIP signatures for OOXML files', () => {
    expect(detectFile('letter.docx', { head: ZIP_HEAD }).signatureMatches).toBe(true);
    expect(detectFile('budget.xlsx', { head: ZIP_HEAD }).signatureMatches).toBe(true);
  });

  it('detects a spoofed extension with mismatched bytes', () => {
    const detected = detectFile('letter.docx', { head: new TextEncoder().encode('plain text') });
    expect(detected.signatureMatches).toBe(false);
  });

  it('accepts an OLE signature only for legacy binary formats', () => {
    expect(detectFile('old.doc', { head: OLE_HEAD }).signatureMatches).toBe(true);
    expect(detectFile('letter.docx', { head: OLE_HEAD }).signatureMatches).toBe(false);
    expect(detectFile('a.pdf', { head: PDF_HEAD }).signatureMatches).toBe(true);
  });
});

describe('app capability helpers', () => {
  it('only opens OOXML and CSV, never legacy formats', () => {
    expect(isOpenableForApp(detectFile('a.docx'), 'word')).toBe(true);
    expect(isOpenableForApp(detectFile('a.doc'), 'word')).toBe(false);
    expect(isOpenableForApp(detectFile('a.csv'), 'sheets')).toBe(true);
    expect(isOpenableForApp(detectFile('a.ods'), 'sheets')).toBe(false);
    expect(isSupportedForApp(detectFile('a.pptx'), 'slides')).toBe(true);
    expect(isSupportedForApp(detectFile('a.docx'), 'slides')).toBe(false);
  });

  it('explains unsupported formats with a concrete next step', () => {
    expect(describeUnsupported(detectFile('a.zip'), 'word')).toContain('not recognised');
    expect(describeUnsupported(detectFile('a.xls'), 'word')).toContain('XLS files are not supported');
  });

  it('advertises PDF export for every app through the print flow', () => {
    expect(supportsPdfExport('word')).toBe(true);
    expect(supportsPdfExport('sheets')).toBe(true);
    expect(supportsPdfExport('slides')).toBe(true);
  });
});

describe('output naming', () => {
  it('strips path separators and unsafe characters', () => {
    expect(sanitizeFileName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFileName('a/b\\c:d*e?.docx')).toBe('c-d-e-.docx');
    expect(sanitizeFileName('   ')).toBe('document');
  });

  it('always writes a new suffixed name', () => {
    expect(buildOutputName('Report.docx', 'docx')).toBe('Report-edited.docx');
    expect(buildOutputName('Report.docx', 'docx')).not.toBe('Report.docx');
    expect(buildOutputName('Report.docx', 'xlsx', { suffix: 'export' })).toBe('Report-export.xlsx');
  });

  it('does not duplicate an existing suffix', () => {
    expect(buildOutputName('Report-edited.docx', 'docx')).toBe('Report-edited.docx');
  });
});
