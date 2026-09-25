import zlib from "node:zlib";
import crypto from "node:crypto";

/**
 * Creates a 512-byte POSIX ustar tar header for a file.
 */
function createTarHeader(name: string, size: number, mtime = Math.floor(Date.now() / 1000)): Buffer {
  const header = Buffer.alloc(512);

  // File name (0 - 100)
  header.write(name.slice(0, 100), 0, 100, "utf8");

  // File mode (100 - 108)
  header.write("0000644\0", 100, 8, "ascii");

  // Owner UID (108 - 116)
  header.write("0000000\0", 108, 8, "ascii");

  // Group GID (116 - 124)
  header.write("0000000\0", 116, 8, "ascii");

  // File size in octal (124 - 136)
  const sizeOctal = size.toString(8).padStart(11, "0") + "\0";
  header.write(sizeOctal, 124, 12, "ascii");

  // Modification time in octal (136 - 148)
  const mtimeOctal = mtime.toString(8).padStart(11, "0") + "\0";
  header.write(mtimeOctal, 136, 12, "ascii");

  // Checksum field initially 8 spaces (148 - 156)
  header.write("        ", 148, 8, "ascii");

  // Type flag: '0' = regular file (156)
  header.write("0", 156, 1, "ascii");

  // Magic & Version (257 - 265)
  header.write("ustar\0", 257, 6, "ascii");
  header.write("00", 263, 2, "ascii");

  // Compute checksum
  let checksum = 0;
  for (let i = 0; i < 512; i++) {
    checksum += header[i];
  }
  const checksumOctal = checksum.toString(8).padStart(6, "0") + "\0 ";
  header.write(checksumOctal, 148, 8, "ascii");

  return header;
}

export interface ArchiveFileEntry {
  path: string;
  data: Buffer;
}

/**
 * Packs a list of file entries into a compressed .tar.gz buffer.
 */
export function packTarGz(entries: ArchiveFileEntry[]): Buffer {
  const blocks: Buffer[] = [];

  for (const entry of entries) {
    // Forward slashes for standard POSIX tar paths
    const normalizedName = entry.path.replace(/\\/g, "/").replace(/^\/+/, "");
    const header = createTarHeader(normalizedName, entry.data.length);
    blocks.push(header);
    blocks.push(entry.data);

    // Pad file content to 512-byte boundary
    const remainder = entry.data.length % 512;
    if (remainder !== 0) {
      blocks.push(Buffer.alloc(512 - remainder));
    }
  }

  // End of archive is marked by two 512-byte zero blocks
  blocks.push(Buffer.alloc(1024));

  const tarBuffer = Buffer.concat(blocks);
  return zlib.gzipSync(tarBuffer);
}

/**
 * Unpacks a compressed .tar.gz buffer into a list of file entries.
 */
export function unpackTarGz(gzipBuffer: Buffer): ArchiveFileEntry[] {
  const tarBuffer = zlib.gunzipSync(gzipBuffer);
  const entries: ArchiveFileEntry[] = [];
  let offset = 0;

  while (offset + 512 <= tarBuffer.length) {
    const header = tarBuffer.subarray(offset, offset + 512);

    // Check for end-of-archive (all zeros)
    if (header.every((b) => b === 0)) {
      break;
    }

    // Read file name
    let nameEnd = 0;
    while (nameEnd < 100 && header[nameEnd] !== 0) {
      nameEnd++;
    }
    const name = header.subarray(0, nameEnd).toString("utf8");

    // Read file size (octal)
    const sizeStr = header.subarray(124, 136).toString("ascii").replace(/\0/g, "").trim();
    const size = parseInt(sizeStr, 8);

    offset += 512;

    if (!isNaN(size) && size > 0 && offset + size <= tarBuffer.length) {
      const data = Buffer.from(tarBuffer.subarray(offset, offset + size));
      entries.push({ path: name, data });

      // Advance offset to next 512-byte block
      const padding = size % 512 === 0 ? 0 : 512 - (size % 512);
      offset += size + padding;
    }
  }

  return entries;
}

/**
 * Computes SHA-256 hash of a buffer.
 */
export function computeSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
