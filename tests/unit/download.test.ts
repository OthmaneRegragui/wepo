import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canUseFileSystemAccess, saveBytesAs, sanitizeFileName } from '@wepo/core';

interface FakeAnchor {
  tagName: string;
  href: string;
  download: string;
  rel: string;
  clicked: boolean;
  removed: boolean;
  click: () => void;
  remove: () => void;
}

let anchors: FakeAnchor[] = [];

function stubDownloadDom(): void {
  const createElement = (tagName: string): FakeAnchor => {
    const anchor: FakeAnchor = {
      tagName,
      href: '',
      download: '',
      rel: '',
      clicked: false,
      removed: false,
      click() {
        anchor.clicked = true;
      },
      remove() {
        anchor.removed = true;
      },
    };
    anchors.push(anchor);
    return anchor;
  };
  vi.stubGlobal('document', {
    createElement,
    body: { appendChild: () => undefined },
  });
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:wepo-test');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
}

beforeEach(() => {
  anchors = [];
  stubDownloadDom();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('saveBytesAs', () => {
  it('falls back to a browser download when no file picker exists', async () => {
    vi.useFakeTimers();
    const outcome = await saveBytesAs(new Uint8Array([1, 2, 3]), 'Report.docx', 'docx');
    expect(outcome).toBe('downloaded');
    expect(anchors).toHaveLength(1);
    expect(anchors[0]).toMatchObject({ tagName: 'a', download: 'Report.docx', clicked: true, removed: true });
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:wepo-test');
  });

  it('uses the File System Access picker and writes a new file', async () => {
    const writes: Blob[] = [];
    const picker = vi.fn(async () => ({
      createWritable: async () => ({
        write: async (blob: Blob) => {
          writes.push(blob);
        },
        close: async () => undefined,
      }),
    }));
    vi.stubGlobal('showSaveFilePicker', picker);

    const outcome = await saveBytesAs(new Uint8Array([9, 9]), 'Deck.pptx', 'pptx');
    expect(outcome).toBe('saved');
    expect(picker).toHaveBeenCalledTimes(1);
    expect(picker.mock.calls[0]?.[0]).toMatchObject({ suggestedName: 'Deck.pptx' });
    expect(writes).toHaveLength(1);
    expect(writes[0]!.size).toBe(2);
    expect(anchors).toHaveLength(0);
  });

  it('reports a cancelled picker without starting a download', async () => {
    vi.stubGlobal('showSaveFilePicker', async () => {
      throw new DOMException('The user cancelled.', 'AbortError');
    });
    const outcome = await saveBytesAs(new Uint8Array([1]), 'Book.xlsx', 'xlsx');
    expect(outcome).toBe('cancelled');
    expect(anchors).toHaveLength(0);
  });

  it('falls back to a download when the picker fails for another reason', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('showSaveFilePicker', async () => {
      throw new Error('permission denied');
    });
    const outcome = await saveBytesAs(new Uint8Array([1]), 'Book.xlsx', 'xlsx');
    expect(outcome).toBe('downloaded');
    expect(anchors[0]?.download).toBe('Book.xlsx');
    vi.runAllTimers();
  });

  it('can skip the picker explicitly', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('showSaveFilePicker', vi.fn(async () => ({ createWritable: async () => ({}) })));
    const outcome = await saveBytesAs(new Uint8Array([1]), 'Book.xlsx', 'xlsx', { preferFileSystemAccess: false });
    expect(outcome).toBe('downloaded');
    expect(anchors).toHaveLength(1);
    vi.runAllTimers();
  });

  it('sanitises the suggested file name before writing', async () => {
    vi.useFakeTimers();
    await saveBytesAs(new Uint8Array([1]), '../../evil:name?.docx', 'docx');
    expect(anchors[0]?.download).toBe(sanitizeFileName('../../evil:name?.docx'));
    expect(anchors[0]?.download).not.toContain('/');
    vi.runAllTimers();
  });
});

describe('canUseFileSystemAccess', () => {
  it('is false without a picker and true with one', () => {
    expect(canUseFileSystemAccess()).toBe(false);
    vi.stubGlobal('showSaveFilePicker', () => undefined);
    expect(canUseFileSystemAccess()).toBe(true);
  });
});
