import React, { useCallback, useEffect, useState } from 'react';
import { Adb } from '@yume-chan/adb';
import Header from './components/Header';
import ScreenViewer from './components/ScreenViewer';
import ScreenshotModal from './components/ScreenshotModal';
import ScreenshotsPanel from './components/ScreenshotsPanel';
import { connectDevice, captureScreen, disconnectDevice, sendText, nowTimestamp } from './utils/adb';
import { Screenshot } from './types';
import './style.css';

const App: React.FC = () => {
  const [adb, setAdb] = useState<Adb | null>(null);
  const [status, setStatus] = useState('Not connected');
  const [statusClass, setStatusClass] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [lastScreenshotBytes, setLastScreenshotBytes] = useState<Uint8Array | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  // Revoke all blob URLs when the page unloads
  useEffect(() => {
    const revoke = () => screenshots.forEach((s) => URL.revokeObjectURL(s.url));
    window.addEventListener('beforeunload', revoke);
    return () => window.removeEventListener('beforeunload', revoke);
  }, [screenshots]);

  const handleConnect = async () => {
    try {
      setStatus('Requesting USB device…');
      const newAdb = await connectDevice();
      if (!newAdb) {
        setStatus('No device selected');
        return;
      }

      setAdb(newAdb);
      setStatus(`Connected: ${newAdb.serial}`);
      setStatusClass('connected');
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
      setStatusClass('error');
      console.error(err);
    }
  };

  const handleDisconnect = async () => {
    setIsStreaming(false);
    if (adb) {
      await disconnectDevice(adb);
      setAdb(null);
    }
    setStatus('Disconnected');
    setStatusClass('');
    setLastScreenshotBytes(null);
  };

  const handleScreenshot = async () => {
    if (!adb) return;
    try {
      setStatus('Capturing…');
      const bytes = await captureScreen(adb);
      setLastScreenshotBytes(bytes);

      const timestamp = nowTimestamp();
      const blob = new Blob([bytes as any], { type: 'image/png' });
      const url = URL.createObjectURL(blob);

      const newScreenshot: Screenshot = {
        id: crypto.randomUUID(),
        bytes,
        timestamp,
        url,
      };

      setScreenshots((prev) => [newScreenshot, ...prev]);
      setStatus(`Connected: ${adb.serial}`);
    } catch (err: any) {
      setStatus(`Capture error: ${err.message}`);
      setStatusClass('error');
      console.error(err);
    }
  };

  const handleToggleStream = () => {
    setIsStreaming((prev) => !prev);
  };

  const handleStopStream = useCallback(() => {
    setIsStreaming(false);
  }, []);

  const handleSendText = async (text: string) => {
    if (!adb) return;
    try {
      setStatus('Sending text…');
      await sendText(adb, text);
      setStatus(`Connected: ${adb.serial}`);
    } catch (err: any) {
      setStatus(`Send error: ${err.message}`);
      setStatusClass('error');
      console.error(err);
    }
  };

  const handleDeleteScreenshot = (id: string) => {
    if (viewingId === id) setViewingId(null);
    setScreenshots((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((s) => s.id !== id);
    });
  };

  const handleViewScreenshot = (screenshot: Screenshot) => {
    setLastScreenshotBytes(screenshot.bytes);
    setViewingId(screenshot.id);
  };

  const handleClearAll = () => {
    screenshots.forEach((s) => URL.revokeObjectURL(s.url));
    setScreenshots([]);
    setViewingId(null);
  };

  const handleCopyStatus = (msg: string) => {
    setStatus(msg);
    if (adb) setTimeout(() => setStatus(`Connected: ${adb.serial}`), 2000);
  };

  const viewingScreenshot = viewingId ? screenshots.find((s) => s.id === viewingId) ?? null : null;

  return (
    <div id="app">
      <Header
        connected={!!adb}
        status={status}
        statusClass={statusClass}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onScreenshot={handleScreenshot}
        onToggleStream={handleToggleStream}
        isStreaming={isStreaming}
        onSendText={handleSendText}
      />

      <main>
        <ScreenViewer
          adb={adb}
          isStreaming={isStreaming}
          onStopStream={handleStopStream}
          lastScreenshotBytes={lastScreenshotBytes}
        />

        <ScreenshotsPanel
          screenshots={screenshots}
          onDelete={handleDeleteScreenshot}
          onView={handleViewScreenshot}
          onClearAll={handleClearAll}
          onCopyStatus={handleCopyStatus}
        />
      </main>

      {viewingScreenshot && (
        <ScreenshotModal
          screenshot={viewingScreenshot}
          onClose={() => setViewingId(null)}
          onDelete={handleDeleteScreenshot}
          onCopyStatus={handleCopyStatus}
        />
      )}
    </div>
  );
};

export default App;
