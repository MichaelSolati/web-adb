import React from 'react';
import { Screenshot } from '../types';
import { downloadAll } from '../utils/download';
import ScreenshotItem from './ScreenshotItem';

interface ScreenshotsPanelProps {
  screenshots: Screenshot[];
  onDelete: (id: string) => void;
  onView: (screenshot: Screenshot) => void;
  onClearAll: () => void;
  onCopyStatus: (msg: string) => void;
}

const ScreenshotsPanel: React.FC<ScreenshotsPanelProps> = ({
  screenshots,
  onDelete,
  onView,
  onClearAll,
  onCopyStatus,
}) => {
  const empty = screenshots.length === 0;

  const handleClearAll = () => {
    if (!window.confirm(`Delete all ${screenshots.length} screenshot(s)?`)) return;
    onClearAll();
  };

  return (
    <aside id="screenshots-panel">
      <div id="screenshots-panel-header">
        <h2>Screenshots</h2>
        <div id="screenshots-bulk-actions">
          <button
            title="Download all screenshots"
            disabled={empty}
            onClick={() => downloadAll(screenshots)}
          >
            ↓ All
          </button>
          <button
            className="delete-btn"
            title="Clear all screenshots"
            disabled={empty}
            onClick={handleClearAll}
          >
            Clear
          </button>
        </div>
      </div>
      <div id="screenshots-list">
        {screenshots.map((s) => (
          <ScreenshotItem
            key={s.id}
            screenshot={s}
            onView={onView}
            onDelete={onDelete}
            onCopyStatus={onCopyStatus}
          />
        ))}
        {empty && <p id="screenshots-empty">No screenshots yet</p>}
      </div>
    </aside>
  );
};

export default ScreenshotsPanel;
