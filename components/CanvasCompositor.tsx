import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { LayoutMode } from '../types';

interface CanvasCompositorProps {
  layout: LayoutMode;
  cameraStream: MediaStream | null;
  screenStream: MediaStream | null;
  activeMediaUrl: string | null; // Overlay Image
  activeVideoUrl: string | null; // Main Video File
  backgroundUrl: string | null; // Custom Template Background
  isLowDataMode?: boolean; // NEW: If true, stop rendering to save battery/cpu
}

export interface CanvasRef {
  getStream: () => MediaStream;
}

const CanvasCompositor = forwardRef<CanvasRef, CanvasCompositorProps>(({ 
  layout, 
  cameraStream, 
  screenStream,
  activeMediaUrl,
  activeVideoUrl,
  backgroundUrl,
  isLowDataMode = false
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camVideoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const screenVideoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const mediaVideoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const overlayImgRef = useRef<HTMLImageElement>(new Image());
  const bgImgRef = useRef<HTMLImageElement>(new Image());
  
  // Initialize video elements configuration
  useEffect(() => {
    [camVideoRef, screenVideoRef, mediaVideoRef].forEach(ref => {
        ref.current.autoplay = true;
        ref.current.muted = true; // Audio is handled via AudioContext elsewhere ideally, or muted for canvas draw
        ref.current.playsInline = true;
    });
    // Video asset should loop? Let's say yes for now, or add controls later
    mediaVideoRef.current.loop = true; 
  }, []);

  // Helper to safely play video
  const safePlay = (videoRef: HTMLVideoElement, streamOrUrl: MediaStream | string | null) => {
    if (!streamOrUrl) {
       videoRef.pause();
       if (videoRef.srcObject) videoRef.srcObject = null;
       if (videoRef.getAttribute('src')) {
         videoRef.removeAttribute('src');
         videoRef.load();
       }
       return;
    }

    // If it's a MediaStream
    if (typeof streamOrUrl !== 'string') {
        if (videoRef.srcObject !== streamOrUrl) {
            videoRef.srcObject = streamOrUrl;
            videoRef.play().catch(e => {
                if (e.name !== 'AbortError') console.error("Video play error (Stream):", e);
            });
        }
    } 
    // If it's a URL (string)
    else {
        if (videoRef.getAttribute('src') !== streamOrUrl) {
            videoRef.src = streamOrUrl;
            videoRef.play().catch(e => {
                if (e.name !== 'AbortError') console.error("Video play error (URL):", e);
            });
        }
    }
  };

  // Update Media Sources
  useEffect(() => {
    if (isLowDataMode) {
        safePlay(camVideoRef.current, null);
    } else {
        safePlay(camVideoRef.current, cameraStream);
    }
  }, [cameraStream, isLowDataMode]);

  useEffect(() => {
    if (isLowDataMode) {
        safePlay(screenVideoRef.current, null);
    } else {
        safePlay(screenVideoRef.current, screenStream);
    }
  }, [screenStream, isLowDataMode]);

  // Handle Uploaded Video Asset
  useEffect(() => {
      if (isLowDataMode) {
        safePlay(mediaVideoRef.current, null);
      } else {
        safePlay(mediaVideoRef.current, activeVideoUrl);
      }
  }, [activeVideoUrl, isLowDataMode]);

  // Handle Images
  useEffect(() => {
    if (activeMediaUrl) overlayImgRef.current.src = activeMediaUrl;
  }, [activeMediaUrl]);

  useEffect(() => {
    if (backgroundUrl) bgImgRef.current.src = backgroundUrl;
  }, [backgroundUrl]);

  useImperativeHandle(ref, () => ({
    getStream: () => {
      if (canvasRef.current) {
        return canvasRef.current.captureStream(30);
      }
      return new MediaStream();
    }
  }));

  // Main Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set resolution to 720p internally for consistency
    canvas.width = 1280;
    canvas.height = 720;

    // If Low Data Mode is active (Cloud Mode), draw a placeholder and STOP the loop
    if (isLowDataMode) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("CLOUD VM ACTIVE", canvas.width/2, canvas.height/2);
        ctx.font = '20px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText("Rendering paused on device", canvas.width/2, canvas.height/2 + 40);
        return; // EXIT LOOP
    }

    let animationId: number;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw Background
      if (backgroundUrl && bgImgRef.current.complete && bgImgRef.current.naturalWidth > 0) {
          ctx.drawImage(bgImgRef.current, 0, 0, w, h);
      } else {
          // Default background gradient
          const grad = ctx.createLinearGradient(0,0, 0, h);
          grad.addColorStop(0, '#111827');
          grad.addColorStop(1, '#000000');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
      }

      // Helper to draw video preserving aspect ratio (cover)
      const drawCover = (video: HTMLVideoElement, x: number, y: number, targetW: number, targetH: number) => {
        if (video.readyState < 2 && video !== mediaVideoRef.current) return;
        if (video === mediaVideoRef.current && video.readyState < 2) return; // Stricter check for files
        
        const vidW = video.videoWidth || 1280;
        const vidH = video.videoHeight || 720;
        const scale = Math.max(targetW / vidW, targetH / vidH);
        const drawnW = vidW * scale;
        const drawnH = vidH * scale;
        const offsetX = (targetW - drawnW) / 2;
        const offsetY = (targetH - drawnH) / 2;

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, targetW, targetH);
        ctx.clip();
        ctx.drawImage(video, x + offsetX, y + offsetY, drawnW, drawnH);
        ctx.restore();
      };

      // Determine "Content" source (Screen Share OR Video File)
      const contentVideo = activeVideoUrl ? mediaVideoRef.current : (screenStream ? screenVideoRef.current : null);
      const hasContent = !!contentVideo;

      // Layout Logic
      if (layout === LayoutMode.FULL_CAM) {
        if (hasContent) {
             drawCover(contentVideo, 0, 0, w, h);
        } else {
             drawCover(camVideoRef.current, 0, 0, w, h);
        }
      } 
      else if (layout === LayoutMode.FULL_SCREEN) {
        if (hasContent) {
            drawCover(contentVideo, 0, 0, w, h);
        } else {
            drawCover(camVideoRef.current, 0, 0, w, h);
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, h-100, w, 100);
            ctx.fillStyle = 'white';
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Select Screen Share or Play Video to fill screen', w/2, h-40);
        }
      } 
      else if (layout === LayoutMode.SPLIT) {
         if (hasContent) {
             drawCover(contentVideo, 0, 0, w/2, h);
         } else {
             ctx.fillStyle = '#222';
             ctx.fillRect(0, 0, w/2, h);
             ctx.fillStyle = 'gray';
             ctx.fillText('No Content', w/4, h/2);
         }
         drawCover(camVideoRef.current, w/2, 0, w/2, h);
         
         ctx.strokeStyle = '#000';
         ctx.lineWidth = 4;
         ctx.beginPath();
         ctx.moveTo(w/2, 0);
         ctx.lineTo(w/2, h);
         ctx.stroke();
      }
      else if (layout === LayoutMode.PIP) {
        if (hasContent) {
            drawCover(contentVideo, 0, 0, w, h);
        } else {
             ctx.fillStyle = '#111';
             ctx.fillRect(0, 0, w, h);
        }

        const pipW = w * 0.25;
        const pipH = h * 0.25;
        const pipX = w - pipW - 30;
        const pipY = h - pipH - 30;

        // Shadow/Border
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(pipX + 10, pipY + 10, pipW, pipH);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipX, pipY, pipW, pipH);

        drawCover(camVideoRef.current, pipX, pipY, pipW, pipH);
      }
      else if (layout === LayoutMode.NEWSROOM) {
          // If a custom background is set, it's already drawn at step 1.
          
          // Screen/Content Window (Shoulder box)
          // Positioned nicely on the left
          const screenW = w * 0.55;
          const screenH = h * 0.55;
          const screenX = 50;
          const screenY = 80;

          // Frame for content
          ctx.fillStyle = 'black';
          ctx.fillRect(screenX - 5, screenY - 5, screenW + 10, screenH + 10);
          
          if (hasContent) {
            drawCover(contentVideo, screenX, screenY, screenW, screenH);
          } else {
            // Placeholder pattern
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(screenX, screenY, screenW, screenH);
          }

          // Camera (Presenter) - Bottom Right, larger
          const camW = w * 0.35;
          const camH = h * 0.35; // slightly wider aspect usually better for presenters
          const camX = w - camW - 50;
          const camY = h - camH - 50;

          ctx.fillStyle = 'black';
          ctx.fillRect(camX - 5, camY - 5, camW + 10, camH + 10);
          drawCover(camVideoRef.current, camX, camY, camW, camH);
      }

      // Draw Overlay Media (Logo/Image/Lower Third)
      if (activeMediaUrl && overlayImgRef.current.complete && overlayImgRef.current.naturalWidth > 0) {
          if (overlayImgRef.current.naturalWidth > 500) {
              ctx.drawImage(overlayImgRef.current, 0, 0, w, h);
          } else {
              // Logo mode
              const logoSize = 120;
              ctx.drawImage(overlayImgRef.current, w - logoSize - 30, 30, logoSize, logoSize);
          }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [layout, cameraStream, screenStream, activeMediaUrl, activeVideoUrl, backgroundUrl, isLowDataMode]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black aspect-video rounded-lg overflow-hidden border border-gray-800 shadow-2xl relative">
        <canvas 
            ref={canvasRef} 
            className="w-full h-full object-contain"
        />
    </div>
  );
});

export default CanvasCompositor;