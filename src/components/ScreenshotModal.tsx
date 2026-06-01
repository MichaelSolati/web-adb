import React, { useEffect, useRef } from 'react';
import { Screenshot } from '../types';
import { copyPngToClipboard } from '../utils/clipboard';
import { downloadPng } from '../utils/download';

interface ScreenshotModalProps {
  screenshot: Screenshot;
  onClose: () => void;
  onDelete: (id: string) => void;
  onCopyStatus: (msg: string) => void;
}

const ScreenshotModal: React.FC<ScreenshotModalProps> = ({ screenshot, onClose, onDelete, onCopyStatus }) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await copyPngToClipboard(screenshot);
      onCopyStatus('Copied to clipboard');
    } catch {
      onCopyStatus('Copy failed — check browser permissions');
    }
  };

  const handleDelete = () => {
    onDelete(screenshot.id);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Screenshot at ${screenshot.timestamp}`}>
        <img src={screenshot.url} alt={`Screenshot at ${screenshot.timestamp}`} className="modal-img" />
        <div className="modal-actions">
          <span className="modal-timestamp">{screenshot.timestamp}</span>
          <button onClick={handleCopy} title="Copy to clipboard">Copy</button>
          <button onClick={() => downloadPng(screenshot)} title="Download PNG">Download</button>
          <button className="delete-btn" onClick={handleDelete} title="Delete">Delete</button>
          <button ref={closeRef} className="modal-close-btn" onClick={onClose} title="Close">✕ Close</button>
        </div>
      </div>
    </div>
  );
};

export default ScreenshotModal;
