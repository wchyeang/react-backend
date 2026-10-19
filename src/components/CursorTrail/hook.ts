import { useRef, useCallback, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

const POINTS_NUMBER = 40;
const WIDTH_FACTOR = 0.3;
const SPRING = 0.4;
const FRICTION = 0.5;

export function useCursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);

  const widthRef = useRef(window.innerWidth);
  const heightRef = useRef(window.innerHeight);
  const pointerRef = useRef({ x: 0.5 * window.innerWidth, y: 0.5 * window.innerHeight });

  const trailRef = useRef(
    Array.from({ length: POINTS_NUMBER }, () => ({
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
    })),
  );

  const isDark = useAppSelector((state) => state.settings.theme) === 'dark';
  const isDarkRef = useRef(isDark);
  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    widthRef.current = window.innerWidth;
    heightRef.current = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(widthRef.current * dpr);
    canvas.height = Math.round(heightRef.current * dpr);
    if (ctxRef.current) ctxRef.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    pointerRef.current.x = widthRef.current * 0.5;
    pointerRef.current.y = heightRef.current * 0.5;
    for (let i = 0; i < trailRef.current.length; i++) {
      trailRef.current[i] = { x: pointerRef.current.x, y: pointerRef.current.y, dx: 0, dy: 0 };
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctxRef.current = canvas.getContext('2d');

    if (ctxRef.current) {
      ctxRef.current.lineCap = 'round';
      ctxRef.current.lineJoin = 'round';
    }

    setupCanvas();

    const tick = () => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;

      const w = widthRef.current;
      const h = heightRef.current;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = isDarkRef.current ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)';

      const trail = trailRef.current;
      const p = pointerRef.current;

      trail.forEach((pt, pIdx) => {
        const prev = pIdx === 0 ? p : trail[pIdx - 1];
        const s = pIdx === 0 ? 0.4 * SPRING : SPRING;
        pt.dx += (prev.x - pt.x) * s;
        pt.dy += (prev.y - pt.y) * s;
        pt.dx *= FRICTION;
        pt.dy *= FRICTION;
        pt.x += pt.dx;
        pt.y += pt.dy;
      });

      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length - 1; i++) {
        const xc = (trail[i].x + trail[i + 1].x) / 2;
        const yc = (trail[i].y + trail[i + 1].y) / 2;
        ctx.lineWidth = WIDTH_FACTOR * (trail.length - i);
        ctx.quadraticCurveTo(trail[i].x, trail[i].y, xc, yc);
        ctx.stroke();
      }
      ctx.lineTo(trail[trail.length - 1].x, trail[trail.length - 1].y);
      ctx.stroke();

      const prev = trail[trail.length - 1];
      if (Math.abs(p.x - prev.x) < 0.05 && Math.abs(p.y - prev.y) < 0.05) {
        runningRef.current = false;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const handleMove = (eX: number, eY: number) => {
      pointerRef.current.x = eX;
      pointerRef.current.y = eY;
      if (!runningRef.current) {
        runningRef.current = true;
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(setupCanvas);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(resizeRaf);
      cancelAnimationFrame(rafRef.current);
      runningRef.current = false;
    };
  }, [setupCanvas]);

  return { canvasRef };
}
