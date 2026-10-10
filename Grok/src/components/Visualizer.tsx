import { useEffect, useRef } from "react";
import { engine } from "@/audio/engine";
import { cn } from "@/lib/utils";

export function Visualizer({ height = 36, bars = 48, className }: { height?: number; bars?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const smooth = useRef(Array.from({ length: bars }, () => 0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let alive = true;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = () => {
      if (!alive) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const spectrum = engine.spectrumData();
      const styles = getComputedStyle(document.documentElement);
      const fg = styles.getPropertyValue("--fg").trim() || "#f4f4f5";
      const gap = Math.max(2, w / bars / 3.4);
      const barW = (w - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        const src = spectrum.length ? spectrum[Math.floor((i / bars) * spectrum.length)] / 255 : 0;
        smooth.current[i] += (src - smooth.current[i]) * 0.18;
        const bh = Math.max(h * 0.06, smooth.current[i] * h * 0.92);
        ctx.globalAlpha = 0.22 + smooth.current[i] * 0.55;
        ctx.fillStyle = fg;
        const x = i * (barW + gap);
        ctx.fillRect(x, h - bh, barW, bh);
      }
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => {
      alive = false;
      cancelAnimationFrame(raf.current);
      observer.disconnect();
    };
  }, [bars]);

  return <canvas ref={canvasRef} className={cn("w-full", className)} style={{ height }} aria-hidden />;
}
