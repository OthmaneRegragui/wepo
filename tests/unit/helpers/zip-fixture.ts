/**
 * Builds a minimal ZIP container whose central directory is real but whose local
 * file records are a stub. This is enough to exercise the central-directory
 * safety audit without decompressing anything.
 */
export interface ZipEntryFixture {
  name?: string;
  method?: number;
  flags?: number;
  compressedSize?: number;
  uncompressedSize?: number;
}

const CENTRAL_SIGNATURE = 0x02014b50;
const EOCD_SIGNATURE = 0x06054b50;

export function makeZip(entries: ZipEntryFixture[], options: { entryCountOverride?: number } = {}): Uint8Array {
  const encoder = new TextEncoder();
  const names = entries.map((entry) => encoder.encode(entry.name ?? 'entry.xml'));
  const centralSize = entries.reduce((sum, _entry, index) => sum + 46 + names[index]!.byteLength, 0);
  const localStubSize = 4;
  const totalSize = localStubSize + centralSize + 22;
  const bytes = new Uint8Array(totalSize);
  const view = new DataView(bytes.buffer);

  // A PK\x03\x04 stub so the bytes look like a ZIP container to callers that check only the signature.
  bytes.set([0x50, 0x4b, 0x03, 0x04], 0);

  let offset = localStubSize;
  entries.forEach((entry, index) => {
    const name = names[index]!;
    view.setUint32(offset, CENTRAL_SIGNATURE, true);
    view.setUint16(offset + 4, 20, true);
    view.setUint16(offset + 6, 20, true);
    view.setUint16(offset + 8, entry.flags ?? 0, true);
    view.setUint16(offset + 10, entry.method ?? 0, true);
    view.setUint32(offset + 20, entry.compressedSize ?? 0, true);
    view.setUint32(offset + 24, entry.uncompressedSize ?? 0, true);
    view.setUint16(offset + 28, name.byteLength, true);
    view.setUint16(offset + 30, 0, true);
    view.setUint16(offset + 32, 0, true);
    bytes.set(name, offset + 46);
    offset += 46 + name.byteLength;
  });

  view.setUint32(offset, EOCD_SIGNATURE, true);
  const declaredEntries = options.entryCountOverride ?? entries.length;
  view.setUint16(offset + 8, declaredEntries, true);
  view.setUint16(offset + 10, declaredEntries, true);
  view.setUint32(offset + 12, centralSize, true);
  view.setUint32(offset + 16, localStubSize, true);
  view.setUint16(offset + 20, 0, true);

  return bytes;
}
