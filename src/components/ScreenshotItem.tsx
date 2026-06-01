import React from 'react';
import { Screenshot } from '../types';
import { copyPngToClipboard } from '../utils/clipboard';
import { downloadPng } from '../utils/download';

interface ScreenshotItemProps {
  screenshot: Screenshot;
  onView: (s: Screenshot) => void;
  onDelete: (id: string) => void;
  onCopyStatus: (msg: string) => void;
}

const ScreenshotItem: React.FC<ScreenshotItemProps> = ({ screenshot: s, onView, onDelete, onCopyStatus }) => {
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await copyPngToClipboard(s);
      onCopyStatus('Copied to clipboard');
    } catch {
      onCopyStatus('Copy failed — check browser permissions');
    }
  };

  return (
    <div className="screenshot-item" onClick={() => onView(s)}>
      <div className="screenshot-thumb-wrap">
        <img src={s.url} alt={`Screenshot at ${s.timestamp}`} />
        <div className="screenshot-hover-overlay">
          <button title="View" aria-label="View screenshot" onClick={(e) => { e.stopPropagation(); onView(s); }}>View</button>
          <button title="Copy" aria-label="Copy to clipboard" onClick={handleCopy}>Copy</button>
          <button title="Download" aria-label="Download PNG" onClick={(e) => { e.stopPropagation(); downloadPng(s); }}>Save</button>
          <button title="Delete" aria-label="Delete screenshot" className="delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}>✕</button>
        </div>
      </div>
      <div className="meta">
        <span>{s.timestamp}</span>
      </div>
    </div>
  );
};

export default ScreenshotItem;
