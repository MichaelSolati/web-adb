import React, { useEffect, useRef, useState } from 'react';
import { Adb } from '@yume-chan/adb';
import { captureScreen } from '../utils/adb';

interface ScreenViewerProps {
  adb: Adb | null;
  isStreaming: boolean;
  onStopStream: () => void;
  lastScreenshotBytes: Uint8Array | null;
}

const ScreenViewer: React.FC<ScreenViewerProps> = ({
  adb,
  isStreaming,
  onStopStream,
  lastScreenshotBytes,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fps, setFps] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const streamingRef = useRef(isStreaming);

  useEffect(() => {
    streamingRef.current = isStreaming;
  }, [isStreaming]);

  const renderFrame = async (pngBytes: Uint8Array) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blob = new Blob([pngBytes as any], { type: 'image/png' });
    const url = URL.createObjectURL(blob);

    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        setShowPlaceholder(false);
        resolve();
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  };

  useEffect(() => {
    if (lastScreenshotBytes) {
      renderFrame(lastScreenshotBytes);
    }
  }, [lastScreenshotBytes]);

  useEffect(() => {
    if (isStreaming && adb) {
      let frameCount = 0;
      let lastFpsTime = performance.now();
      let active = true;

      const streamLoop = async () => {
        while (active && streamingRef.current) {
          try {
            const bytes = await captureScreen(adb);
            if (!active || !streamingRef.current) break;
            await renderFrame(bytes);

            frameCount++;
            const now = performance.now();
            if (now - lastFpsTime >= 1000) {
              setFps(Math.round((frameCount * 1000) / (now - lastFpsTime)));
              frameCount = 0;
              lastFpsTime = now;
            }
          } catch (err) {
            console.error('Stream error:', err);
            if (active && streamingRef.current) {
              onStopStream();
            }
            break;
          }
        }
      };

      streamLoop();

      return () => {
        active = false;
      };
    } else {
      setFps(0);
    }
  }, [isStreaming, adb, onStopStream]);

  return (
    <div id="screen-container">
      <canvas ref={canvasRef} id="screen-canvas" className={!showPlaceholder ? 'visible' : ''}></canvas>
      {isStreaming && <div className="stream-fps visible">{fps} fps</div>}
      {showPlaceholder && (
        <div id="placeholder">
          <p>Connect an Android device to view its screen</p>
          <p className="hint">USB Debugging must be enabled on the device</p>
        </div>
      )}
    </div>
  );
};

export default ScreenViewer;
