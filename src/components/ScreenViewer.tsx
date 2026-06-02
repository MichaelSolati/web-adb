import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Adb } from '@yume-chan/adb';
import { captureScreen, sendSwipe, sendTap } from '../utils/adb';

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

  // drag state — refs so we don't trigger re-renders during a gesture
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartTimeRef = useRef(0);

  useEffect(() => {
    streamingRef.current = isStreaming;
  }, [isStreaming]);

  // Map a CSS-space point on the canvas element to device pixel coordinates
  const toDeviceCoords = (e: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!adb) return;
    const pt = toDeviceCoords(e);
    if (!pt) return;
    dragStartRef.current = pt;
    dragStartTimeRef.current = Date.now();
  }, [adb]);

  // TAP_THRESHOLD: if the finger moved less than this many device px it's a tap
  const TAP_THRESHOLD = 10;

  const handleCanvasMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!adb || !dragStartRef.current) return;
    const start = dragStartRef.current;
    dragStartRef.current = null;

    const end = toDeviceCoords(e);
    if (!end) return;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const elapsed = Date.now() - dragStartTimeRef.current;

    if (dist < TAP_THRESHOLD) {
      sendTap(adb, start.x, start.y).catch(console.warn);
    } else {
      // duration mirrors how long the user held the drag, clamped to 100–1500ms
      const duration = Math.max(100, Math.min(1500, elapsed));
      sendSwipe(adb, start.x, start.y, end.x, end.y, duration).catch(console.warn);
    }
  }, [adb]);

  // Cancel drag if mouse leaves the canvas mid-gesture
  const handleCanvasMouseLeave = useCallback(() => {
    dragStartRef.current = null;
  }, []);

  // Accumulate wheel delta so fast scrolls produce longer swipes
  const wheelAccRef = useRef(0);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCanvasWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!adb) return;
    e.preventDefault();
    const pt = toDeviceCoords(e);
    if (!pt) return;

    wheelAccRef.current += e.deltaY;

    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    wheelTimerRef.current = setTimeout(() => {
      const delta = wheelAccRef.current;
      wheelAccRef.current = 0;

      // Clamp swipe length to ±800px; map 1 wheel unit ≈ 0.8 device px
      const distance = Math.max(-800, Math.min(800, delta * 0.8));
      const x = pt.x;
      const y = pt.y;
      // scrolling down (positive delta) → swipe finger upward (y decreases)
      sendSwipe(adb, x, y, x, y - distance, 250).catch(console.warn);
    }, 50);
  }, [adb]);

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

  const interactive = !!adb && !showPlaceholder;

  return (
    <div id="screen-container">
      <canvas
        ref={canvasRef}
        id="screen-canvas"
        className={!showPlaceholder ? 'visible' : ''}
        style={interactive ? { cursor: 'crosshair' } : undefined}
        onMouseDown={interactive ? handleCanvasMouseDown : undefined}
        onMouseUp={interactive ? handleCanvasMouseUp : undefined}
        onMouseLeave={interactive ? handleCanvasMouseLeave : undefined}
        onWheel={interactive ? handleCanvasWheel : undefined}
      />
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
