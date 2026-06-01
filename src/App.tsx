import React, { useState, useCallback } from 'react';
import { Adb } from '@yume-chan/adb';
import Header from './components/Header';
import ScreenViewer from './components/ScreenViewer';
import ScreenshotsPanel from './components/ScreenshotsPanel';
import { connectDevice, captureScreen, sendText, nowTimestamp } from './utils/adb';
import { Screenshot } from './types';
import './style.css';

const App: React.FC = () => {
  const [adb, setAdb] = useState<Adb | null>(null);
  const [status, setStatus] = useState('Not connected');
  const [statusClass, setStatusClass] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [lastScreenshotBytes, setLastScreenshotBytes] = useState<Uint8Array | null>(null);

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
      try {
        await (adb.transport as any).dispose();
      } catch {}
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
    setScreenshots((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((s) => s.id !== id);
    });
  };

  const handleViewScreenshot = (screenshot: Screenshot) => {
    setLastScreenshotBytes(screenshot.bytes);
  };

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
        />
      </main>
    </div>
  );
};

export default App;
