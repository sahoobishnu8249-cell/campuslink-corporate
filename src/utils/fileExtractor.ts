/**
 * Utility to extract text and data URLs from uploaded resume and document files
 * Supports PDF, DOCX, TXT, MD, RTF, JSON, etc.
 */

export interface ExtractedFileResult {
  text: string;
  dataUrl: string;
  fileName: string;
  fileSize: string;
  fileType: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Extracts raw readable text from a PDF ArrayBuffer
 */
function extractTextFromPdfBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binaryString = '';
  // Sample up to 1MB of binary content to prevent browser freeze on huge files
  const maxBytes = Math.min(bytes.length, 1024 * 1024);
  for (let i = 0; i < maxBytes; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }

  const extractedChunks: string[] = [];

  // Match text in PDF strings: (Text) Tj or [(T) 10 (ext)] TJ
  const tjRegex = /\(([^)]+)\)\s*Tj/g;
  let match: RegExpExecArray | null;
  while ((match = tjRegex.exec(binaryString)) !== null) {
    if (match[1] && match[1].trim().length > 1) {
      extractedChunks.push(match[1].replace(/\\([()\\])/g, '$1'));
    }
  }

  const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
  while ((match = tjArrayRegex.exec(binaryString)) !== null) {
    const inner = match[1];
    const subMatches = inner.match(/\(([^)]+)\)/g);
    if (subMatches) {
      const combined = subMatches
        .map(s => s.slice(1, -1).replace(/\\([()\\])/g, '$1'))
        .join('');
      if (combined.trim().length > 1) {
        extractedChunks.push(combined);
      }
    }
  }

  // If specific PDF operator regex found good chunks, return them
  if (extractedChunks.length > 5) {
    return extractedChunks.join(' ');
  }

  // Fallback: Extract all printable ASCII sequences of 3 or more chars
  const asciiChunks = binaryString.match(/[\x20-\x7E\r\n\t]{3,}/g) || [];
  const filteredAscii = asciiChunks
    .filter(chunk => {
      // Filter out PDF stream artifacts, font headers, obj markers
      if (/^(obj|endobj|stream|endstream|xref|trailer|startxref)/i.test(chunk)) return false;
      if (/^\/[A-Z0-9_]+/i.test(chunk)) return false; // PDF name object
      if (chunk.length < 3) return false;
      return true;
    })
    .map(c => c.trim())
    .filter(Boolean);

  if (filteredAscii.length > 0) {
    return filteredAscii.join(' ');
  }

  return '';
}

/**
 * Extracts text and data URL from user uploaded file
 */
export async function extractFileContent(file: File): Promise<ExtractedFileResult> {
  const fileName = file.name;
  const fileSize = formatFileSize(file.size);
  const fileType = file.type || 'application/octet-stream';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error(`Failed to read file ${fileName}`));
    };

    reader.onload = async () => {
      const dataUrl = reader.result as string;

      // Plain text or Markdown or JSON
      if (
        file.type.startsWith('text/') ||
        fileName.endsWith('.txt') ||
        fileName.endsWith('.md') ||
        fileName.endsWith('.json') ||
        fileName.endsWith('.csv') ||
        fileName.endsWith('.rtf')
      ) {
        const textReader = new FileReader();
        textReader.onload = () => {
          const text = (textReader.result as string) || '';
          resolve({
            text,
            dataUrl,
            fileName,
            fileSize,
            fileType
          });
        };
        textReader.readAsText(file);
        return;
      }

      // PDF File
      if (file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
        const bufferReader = new FileReader();
        bufferReader.onload = () => {
          const buffer = bufferReader.result as ArrayBuffer;
          const extractedText = extractTextFromPdfBuffer(buffer);
          resolve({
            text: extractedText,
            dataUrl,
            fileName,
            fileSize,
            fileType: 'application/pdf'
          });
        };
        bufferReader.readAsArrayBuffer(file);
        return;
      }

      // Word documents or others
      const textReader = new FileReader();
      textReader.onload = () => {
        const raw = (textReader.result as string) || '';
        // Pull printable ASCII text
        const asciiMatches = raw.match(/[\x20-\x7E\r\n\t]{3,}/g) || [];
        const clean = asciiMatches
          .filter(c => c.length > 2 && !c.includes('<?xml') && !c.includes('<w:'))
          .join(' ');
        resolve({
          text: clean,
          dataUrl,
          fileName,
          fileSize,
          fileType
        });
      };
      textReader.readAsText(file);
    };

    reader.readAsDataURL(file);
  });
}
