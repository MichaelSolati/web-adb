import React from 'react';
import { Screenshot } from '../types';

interface ScreenshotsPanelProps {
  screenshots: Screenshot[];
  onDelete: (id: string) => void;
  onView: (screenshot: Screenshot) => void;
}

const ScreenshotsPanel: React.FC<ScreenshotsPanelProps> = ({
  screenshots,
  onDelete,
  onView,
}) => {
  return (
    <aside id="screenshots-panel">
      <h2>Saved Screenshots</h2>
      <div id="screenshots-list">
        {screenshots.map((s) => (
          <div key={s.id} className="screenshot-item" onClick={() => onView(s)}>
            <img src={s.url} alt={`Screenshot at ${s.timestamp}`} />
            <div className="meta">
              <span>{s.timestamp}</span>
              <button
                className="save-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  const a = document.createElement('a');
                  a.href = s.url;
                  a.download = `screenshot-${s.timestamp.replace(/[: ]/g, '-')}.png`;
                  a.click();
                }}
              >
                Save
              </button>
              <button
                className="delete-btn"
                title="Remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(s.id);
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default ScreenshotsPanel;
