import { useRef, useCallback, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

export function usePixelTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);

  const CELL_SIZE = 14;
  const GLOW_RADIUS = 3;
  const MAX_LIFE = 1200;

  const colsRef = useRef(0);
  const rowsRef = useRef(0);
  const gridRef = useRef<Float64Array | null>(null);
  const factorRef = useRef<Float32Array | null>(null);
  const dirtyCellsRef = useRef(new Set<number>());
  const movedRef = useRef(false);

  const widthRef = useRef(window.innerWidth);
  const heightRef = useRef(window.innerHeight);
  const pointerRef = useRef({ x: 0.5 * window.innerWidth, y: 0.5 * window.innerHeight });

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
    colsRef.current = Math.ceil(widthRef.current / CELL_SIZE);
    rowsRef.current = Math.ceil(heightRef.current / CELL_SIZE);
    gridRef.current = new Float64Array(colsRef.current * rowsRef.current);
    factorRef.current = new Float32Array(colsRef.current * rowsRef.current);
    dirtyCellsRef.current.clear();
    pointerRef.current.x = widthRef.current * 0.5;
    pointerRef.current.y = heightRef.current * 0.5;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctxRef.current = canvas.getContext('2d');
    setupCanvas();

    function glow(centerCol: number, centerRow: number, now: number) {
      const cols = colsRef.current;
      const rows = rowsRef.current;
      const grid = gridRef.current;
      const factor = factorRef.current;
      if (!grid || !factor) return;
      for (let dr = -GLOW_RADIUS; dr <= GLOW_RADIUS; dr++) {
        for (let dc = -GLOW_RADIUS; dc <= GLOW_RADIUS; dc++) {
          const dist = Math.sqrt(dr * dr + dc * dc);
          if (dist > GLOW_RADIUS) continue;
          const brightness = 1 - dist / GLOW_RADIUS;
          const col = centerCol + dc;
          const row = centerRow + dr;
          if (col < 0 || col >= cols || row < 0 || row >= rows) continue;
          const idx = row * cols + col;
          if (factor[idx] < brightness) {
            factor[idx] = brightness;
            grid[idx] = now;
            dirtyCellsRef.current.add(idx);
          }
        }
      }
    }

    const tick = () => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;
      const w = widthRef.current;
      const h = heightRef.current;
      const cols = colsRef.current;
      const grid = gridRef.current;
      const factor = factorRef.current;
      if (!grid || !factor) return;

      ctx.clearRect(0, 0, w, h);

      const now = performance.now();
      if (movedRef.current) {
        const cursorCol = Math.floor(pointerRef.current.x / CELL_SIZE);
        const cursorRow = Math.floor(pointerRef.current.y / CELL_SIZE);
        glow(cursorCol, cursorRow, now);
        movedRef.current = false;
      }

      let hasLit = false;
      for (const idx of dirtyCellsRef.current) {
        const ts = grid[idx];
        const age = now - ts;
        if (age >= MAX_LIFE) {
          grid[idx] = 0;
          factor[idx] = 0;
          dirtyCellsRef.current.delete(idx);
          continue;
        }
        hasLit = true;
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = col * CELL_SIZE + 1;
        const y = row * CELL_SIZE + 1;
        const size = CELL_SIZE - 2;
        const alpha = Math.max(0, 1 - age / MAX_LIFE) * factor[idx] * 0.7;
        ctx.fillStyle = isDarkRef.current
          ? `rgba(100,200,255,${alpha.toFixed(2)})`
          : `rgba(50,100,200,${alpha.toFixed(2)})`;
        ctx.fillRect(x, y, size, size);
      }

      if (!hasLit) {
        runningRef.current = false;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const handleMove = (eX: number, eY: number) => {
      pointerRef.current.x = eX;
      pointerRef.current.y = eY;
      movedRef.current = true;
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
