import { useRef, useEffect, useCallback, useMemo } from "react";
import type { MapRef } from "react-map-gl/mapbox";

interface Footprint {
  lat: number;
  lng: number;
}

interface FogOfWarCanvasProps {
  mapRef: React.RefObject<MapRef | null>;
  footprints: Footprint[];
  visible: boolean;
  routeCoordinates?: [number, number][];
  showTourRoute?: boolean;
}

// Each drifting cloud puff
// Load cloud images once
const cloudImages = [new Image(), new Image()];
cloudImages[0].src = "/clouds/cloud1.png";
cloudImages[1].src = "/clouds/cloud2.png";

// Robust pseudo-random hash (GLSL style) to completely eliminate grid artifacts
function hashPos(x: number, y: number, c: number, p: number): number {
  const seed = x * 12.9898 + y * 78.233 + c * 37.719 + p * 19.113;
  const sn = Math.sin(seed) * 43758.5453123;
  return sn - Math.floor(sn);
}

// ── Pre-render brushes for massive performance boost ────────────────────────
function createHoleBrush() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  
  const r = 64;
  const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
  // Matches the core + feather look
  grad.addColorStop(0, "rgba(0,0,0,1)");
  grad.addColorStop(0.4, "rgba(0,0,0,1)"); // core
  grad.addColorStop(0.7, "rgba(0,0,0,0.5)"); // start fade
  grad.addColorStop(0.9, "rgba(0,0,0,0.1)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

export const FogOfWarCanvas: React.FC<FogOfWarCanvasProps> = ({
  mapRef,
  footprints,
  visible,
  routeCoordinates,
  showTourRoute,
}) => {
  const canvasRef  = useRef<HTMLCanvasElement | null>(null);
  const animRef    = useRef<number>(0);
  
  const holeBrush = useMemo(() => createHoleBrush(), []);

  const metersToPixels = useCallback(
    (meters: number, lat: number): number => {
      const map = mapRef.current?.getMap();
      if (!map) return 60;
      const zoom = map.getZoom();
      const mpp =
        (40075016.686 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom + 8);
      return meters / mpp;
    },
    [mapRef]
  );

  const project = useCallback(
    (lng: number, lat: number) => {
      const map = mapRef.current?.getMap();
      if (!map || isNaN(lng) || isNaN(lat)) return null;
      try {
        const pt = map.project([lng, lat]);
        return { x: pt.x, y: pt.y };
      } catch {
        return null;
      }
    },
    [mapRef]
  );

  const draw = useCallback(
    (ts: number, canvas: HTMLCanvasElement, dt: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;

      // ── 1. Clear ────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H);
      ctx.save();

      // ── 2. Base fog ─────────────────────────────────────────────────────
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(45, 8, 88, 0.55)";
      ctx.fillRect(0, 0, W, H);

      // ── 3. Geographically Anchored Drifting Clouds ──────────────────────
      const map = mapRef.current?.getMap();
      if (map) {
        const zoom = map.getZoom();
        
        // Fade out clouds when zoomed out to prevent overwhelming the view (and lag)
        let cloudAlpha = 1;
        if (zoom < 11) cloudAlpha = zoom - 10;
        
        if (cloudAlpha > 0) {
          const bounds = map.getBounds();
          const GRID_DEG = 0.04; // Use a massive 4km grid cell to completely break the "lined up" grid pattern
          
          // Chill drift: move the entire cloud field slowly diagonally over time
          const driftLng = ts * 0.0000015; // Faster drift East
          const driftLat = ts * 0.0000005; // Gentle drift South
          
          const w = bounds.getWest() - driftLng;
          const e = bounds.getEast() - driftLng;
          const s = bounds.getSouth() - driftLat;
          const n = bounds.getNorth() - driftLat;
          
          const startX = Math.floor(w / GRID_DEG) - 1;
          const endX = Math.ceil(e / GRID_DEG) + 1;
          const startY = Math.floor(s / GRID_DEG) - 1;
          const endY = Math.ceil(n / GRID_DEG) + 1;
          
          // Only render if we aren't insanely zoomed out (fallback safety)
          if ((endX - startX) < 120 && (endY - startY) < 120) {
            for (let x = startX; x <= endX; x++) {
              for (let y = startY; y <= endY; y++) {
                // Attempt to spawn up to 4 clouds per large 4km grid cell
                for (let c = 0; c < 4; c++) {
                  const h1 = hashPos(x, y, c, 1);
                  
                  // 45% chance to spawn this specific cloud -> averages ~1.8 clouds per huge 4km area
                  if (h1 > 0.45) continue;
                  
                  const h2 = hashPos(x, y, c, 2);
                  const h3 = hashPos(x, y, c, 3);
                  const h4 = hashPos(x, y, c, 4);
                  const h5 = hashPos(x, y, c, 5);
                  const h6 = hashPos(x, y, c, 6);
                  
                  // Cloud position anchored to geography, plus the global drift
                  const lng = x * GRID_DEG + h2 * GRID_DEG + driftLng;
                  const lat = y * GRID_DEG + h3 * GRID_DEG + driftLat;
                  
                  const pt = project(lng, lat);
                  if (!pt) continue;
                  
                  // Cloud size in METERS (300m - 1000m), ensures they are visible
                  const radiusM = 300 + h4 * 700;
                  const rPx = metersToPixels(radiusM, lat);
                
                const imgIdx = h5 > 0.5 ? 1 : 0;
                const img = cloudImages[imgIdx];
                if (!img || !img.complete || img.naturalWidth === 0) continue;
                
                // Pulsing opacity for a living feel
                const pulse = 0.8 + 0.2 * Math.sin(ts * 0.001 + h6 * Math.PI * 2);
                ctx.globalAlpha = (0.2 + h1 * 0.4) * pulse * cloudAlpha;
                
                  ctx.save();
                  ctx.translate(pt.x, pt.y);
                  // Giữ mây ngay ngắn (không xoay)
                  ctx.drawImage(img, -rPx, -rPx, rPx * 2, rPx * 2);
                  ctx.restore();
                }
              }
            }
          }
        }
      }
      ctx.globalAlpha = 1.0;

      // ── 4. Reveal holes at visited footprints (using pre-rendered brush) 
      const REVEAL_M = 300;
      ctx.globalCompositeOperation = "destination-out";

      footprints.forEach((fp) => {
        const pt = project(fp.lng, fp.lat);
        if (!pt) return;

        const revPx  = metersToPixels(REVEAL_M, fp.lat);
        const outerR = revPx * 1.4;

        // Draw the pre-rendered hole brush
        ctx.drawImage(holeBrush, pt.x - outerR, pt.y - outerR, outerR * 2, outerR * 2);
      });

      // ── 5. Subtle edge vignette ─────────────────────────────────────────
      ctx.globalCompositeOperation = "source-over";
      const vig = ctx.createRadialGradient(
        W / 2, H / 2, Math.min(W, H) * 0.4,
        W / 2, H / 2, Math.max(W, H) * 0.72
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(28,4,65,0.22)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      // ── 6. Draw Tour Route on top of fog (if enabled) ───────────────────
      if (showTourRoute && routeCoordinates && routeCoordinates.length > 1) {
        ctx.globalCompositeOperation = "source-over";
        const map = mapRef.current?.getMap();
        if (map) {
          const zoom = map.getZoom();
          
          // Mapbox zoom interpolation for line widths (zoom 10 -> 15)
          const f = Math.max(0, Math.min(1, (zoom - 10) / 5));
          const glowWidth = 8 + f * (14 - 8);
          const mainWidth = 3 + f * (6 - 3);
          const dashWidth = 1 + f * (2 - 1);

          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          
          const drawPath = () => {
            ctx.beginPath();
            let first = true;
            for (let i = 0; i < routeCoordinates.length; i++) {
              const pt = project(routeCoordinates[i][0], routeCoordinates[i][1]);
              if (!pt) continue;
              if (first) {
                ctx.moveTo(pt.x, pt.y);
                first = false;
              } else {
                ctx.lineTo(pt.x, pt.y);
              }
            }
          };

          // Glow layer
          ctx.lineWidth = glowWidth;
          ctx.strokeStyle = "rgba(0, 70, 160, 0.5)";
          ctx.shadowColor = "rgba(0, 70, 160, 0.5)";
          ctx.shadowBlur = 6;
          drawPath();
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Main line layer
          ctx.lineWidth = mainWidth;
          ctx.strokeStyle = "#0ea5e9";
          drawPath();
          ctx.stroke();

          // Dash layer
          ctx.lineWidth = dashWidth;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.setLineDash([dashWidth * 2, dashWidth * 4]);
          drawPath();
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      ctx.restore();
    },
    [footprints, project, metersToPixels, holeBrush, routeCoordinates, showTourRoute]
  );

  // Keep a ref to the latest draw function to prevent stale closures in the animation loop
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    if (!visible) {
      cancelAnimationFrame(animRef.current);
      if (canvasRef.current?.parentElement) {
        canvasRef.current.parentElement.removeChild(canvasRef.current);
      }
      canvasRef.current = null;
      return;
    }

    const map = mapRef.current?.getMap();
    if (!map) return;

    const setup = () => {
      if (canvasRef.current) return;

      const container = map.getContainer();
      const canvas = document.createElement("canvas");
      canvas.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
      // No z-index: mapboxgl-canvas has none, so being next sibling puts it naturally on top of WebGL but below markers
      canvasRef.current = canvas;

      // Insert inside .mapboxgl-canvas-container, directly AFTER .mapboxgl-canvas
      // This ensures it sits below the markers (which are appended later in the container)
      const glCanvas = container.querySelector(".mapboxgl-canvas");
      if (glCanvas && glCanvas.parentNode) {
        glCanvas.parentNode.insertBefore(canvas, glCanvas.nextSibling);
      } else {
        container.appendChild(canvas);
      }

      const resize = () => {
        const c = canvasRef.current;
        if (!c) return;
        c.width  = container.clientWidth;
        c.height = container.clientHeight;
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(container);

      let lastTs = 0;
      const loop = (ts: number) => {
        // Limit FPS to ~30 for better performance (33ms per frame)
        if (ts - lastTs < 33) {
          animRef.current = requestAnimationFrame(loop);
          return;
        }
        const dt = Math.min((ts - lastTs) / 1000, 0.1); 
        lastTs = ts;
        const c = canvasRef.current;
        if (c && drawRef.current) {
          try {
            drawRef.current(ts, c, dt);
          } catch (e) {
            console.error("FogOfWarCanvas draw error:", e);
          }
        }
        animRef.current = requestAnimationFrame(loop);
      };
      animRef.current = requestAnimationFrame(loop);

      return () => {
        ro.disconnect();
        cancelAnimationFrame(animRef.current);
        canvas.parentElement?.removeChild(canvas);
        canvasRef.current = null;
      };
    };

    let cleanup: (() => void) | undefined;
    
    // The map style might be mutating, causing map.loaded() to be false.
    // The "load" event only fires once, so waiting for it again causes a hang.
    // As long as we have the DOM container, we can safely mount our overlay.
    if (map.getContainer()) {
      cleanup = setup();
    } else {
      setTimeout(() => { cleanup = setup(); }, 100);
    }

    return () => { cleanup?.(); };
  }, [visible, mapRef]);

  return null;
};

export default FogOfWarCanvas;
