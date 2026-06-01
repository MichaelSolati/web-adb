import { Screenshot } from '../types';

export async function copyPngToClipboard(s: Screenshot): Promise<void> {
  const blob = new Blob([s.bytes.buffer as ArrayBuffer], { type: 'image/png' });
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
