import { Screenshot } from '../types';

function triggerDownload(url: string, filename: string, revoke = false) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  if (revoke) setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadPng(s: Screenshot) {
  triggerDownload(s.url, `screenshot-${s.timestamp.replace(/[: ]/g, '-')}.png`);
}

export function downloadAll(list: Screenshot[]) {
  list.forEach((s, i) => {
    // small delay so the browser doesn't block multiple simultaneous downloads
    setTimeout(() => triggerDownload(s.url, `screenshot-${s.timestamp.replace(/[: ]/g, '-')}.png`), i * 150);
  });
}
