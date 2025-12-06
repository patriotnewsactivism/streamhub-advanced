
import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { LayoutMode } from '../types';

interface CanvasCompositorProps {
  layout: LayoutMode;
  cameraStream: MediaStream | null;
  screenStream: MediaStream | null;
  activeMediaUrl: string | null; // Overlay Image
  activeVideoUrl: string | null; // Main Video File
  backgroundUrl: string | null; // Custom Template Background
  isLowDataMode?: boolean; // NEW: If true, stop rendering to save battery/cpu
  showWatermark?: boolean; // NEW: Render watermark if true
}

export interface CanvasRef {
  getStream: () => MediaStream;
  getVideoElement: () => HTMLVideoElement; // Expose the internal media player for audio mixing
}

const CanvasCompositor = forwardRef<CanvasRef, CanvasCompositorProps>(({ 
  layout, 
  cameraStream, 
  screenStream,
  activeMediaUrl,
  activeVideoUrl,
  backgroundUrl,
  isLowDataMode = false,
  showWatermark = false
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Media Elements
  const camVideoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const screenVideoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const mediaVideoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  
  const overlayImgRef = useRef<HTMLImageElement>(new Image());
  const bgImgRef = useRef<HTMLImageElement>(new Image());

  // PIP State
  const [pipPos, setPipPos] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const pipRectRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Initialize video elements configuration
  useEffect(() => {
    [camVideoRef, screenVideoRef, mediaVideoRef].forEach(ref => {
        ref.current.autoplay = true;
        ref.current.muted = true; 
        ref.current.playsInline = true;
        ref.current.crossOrigin = "anonymous";
    });
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

    if (typeof streamOrUrl !== 'string') {
        if (videoRef.srcObject !== streamOrUrl) {
            videoRef.srcObject = streamOrUrl;
            videoRef.play().catch(e => {
                if (e.name !== 'AbortError') console.error("Video play error (Stream):", e);
            });
        }
    } 
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

  useEffect(() => {
      if (isLowDataMode) {
        safePlay(mediaVideoRef.current, null);
      } else {
        safePlay(mediaVideoRef.current, activeVideoUrl);
      }
  }, [activeVideoUrl, isLowDataMode]);

  useEffect(() => {
    if (activeMediaUrl) {
        overlayImgRef.current.crossOrigin = "anonymous";
        overlayImgRef.current.src = activeMediaUrl;
    }
  }, [activeMediaUrl]);

  useEffect(() => {
    if (backgroundUrl) {
        bgImgRef.current.crossOrigin = "anonymous";
        bgImgRef.current.src = backgroundUrl;
    }
  }, [backgroundUrl]);

  useImperativeHandle(ref, () => ({
    getStream: () => {
      if (canvasRef.current) {
        // Force 30fps capture
        return canvasRef.current.captureStream(30);
      }
      return new MediaStream();
    },
    getVideoElement: () => mediaVideoRef.current
  }));

  // --- MOUSE / TOUCH EVENTS FOR PIP ---
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      if (layout !== LayoutMode.PIP) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (clientX - rect.left) * scaleX;
      const mouseY = (clientY - rect.top) * scaleY;

      const p = pipRectRef.current;
      if (mouseX >= p.x && mouseX <= p.x + p.w && mouseY >= p.y && mouseY <= p.y + p.h) {
          isDraggingRef.current = true;
          dragOffsetRef.current = { x: mouseX - p.x, y: mouseY - p.y };
      }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDraggingRef.current || layout !== LayoutMode.PIP) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (clientX - rect.left) * scaleX;
      const mouseY = (clientY - rect.top) * scaleY;

      const newX = mouseX - dragOffsetRef.current.x;
      const newY = mouseY - dragOffsetRef.current.y;

      const maxX = canvas.width - pipRectRef.current.w;
      const maxY = canvas.height - pipRectRef.current.h;
      
      setPipPos({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
      });
  };

  const handleMouseUp = () => {
      isDraggingRef.current = false;
  };

  // Main Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    canvas.width = 1280;
    canvas.height = 720;

    if (pipPos.x === 0 && pipPos.y === 0) {
        setPipPos({ x: canvas.width - (canvas.width * 0.25) - 30, y: canvas.height - (canvas.height * 0.25) - 30 });
    }

    if (isLowDataMode) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("CLOUD VM ACTIVE", canvas.width/2, canvas.height/2);
        return;
    }

    let animationId: number;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw Background
      if (backgroundUrl && bgImgRef.current.complete && bgImgRef.current.naturalWidth > 0) {
          ctx.drawImage(bgImgRef.current, 0, 0, w, h);
      } else {
          const grad = ctx.createLinearGradient(0,0, 0, h);
          grad.addColorStop(0, '#111827');
          grad.addColorStop(1, '#000000');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
      }

      const drawCover = (video: HTMLVideoElement, x: number, y: number, targetW: number, targetH: number) => {
        if (video.readyState < 2 && video !== mediaVideoRef.current) return;
        if (video === mediaVideoRef.current && video.readyState < 2) return; 
        
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
        const pipX = pipPos.x;
        const pipY = pipPos.y;
        
        pipRectRef.current = { x: pipX, y: pipY, w: pipW, h: pipH };

        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 10;
        
        drawCover(camVideoRef.current, pipX, pipY, pipW, pipH);
        
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipX, pipY, pipW, pipH);
      }
      else if (layout === LayoutMode.NEWSROOM) {
          const screenW = w * 0.55;
          const screenH = h * 0.55;
          const screenX = 50;
          const screenY = 80;

          ctx.fillStyle = 'black';
          ctx.fillRect(screenX - 5, screenY - 5, screenW + 10, screenH + 10);
          
          if (hasContent) {
            drawCover(contentVideo, screenX, screenY, screenW, screenH);
          } else {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(screenX, screenY, screenW, screenH);
          }

          const camW = w * 0.35;
          const camH = h * 0.35; 
          const camX = w - camW - 50;
          const camY = h - camH - 50;

          ctx.fillStyle = 'black';
          ctx.fillRect(camX - 5, camY - 5, camW + 10, camH + 10);
          drawCover(camVideoRef.current, camX, camY, camW, camH);
      }

      // Draw Overlay Image
      if (activeMediaUrl && overlayImgRef.current.complete && overlayImgRef.current.naturalWidth > 0) {
          if (overlayImgRef.current.naturalWidth > 500) {
              ctx.drawImage(overlayImgRef.current, 0, 0, w, h);
          } else {
              const logoSize = 120;
              ctx.drawImage(overlayImgRef.current, w - logoSize - 30, 30, logoSize, logoSize);
          }
      }

      // Draw Watermark (New)
      if (showWatermark) {
          ctx.save();
          ctx.font = 'bold 24px sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 4;
          ctx.fillText('Powered by StreamHub Pro', w - 20, 20);
          ctx.restore();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [layout, cameraStream, screenStream, activeMediaUrl, activeVideoUrl, backgroundUrl, isLowDataMode, pipPos, showWatermark]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black aspect-video rounded-lg overflow-hidden border border-gray-800 shadow-2xl relative">
        <canvas 
            ref={canvasRef} 
            className="w-full h-full object-contain cursor-auto"
            style={{ cursor: layout === LayoutMode.PIP ? 'move' : 'default' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
        />
    </div>
  );
});

export default CanvasCompositor;
