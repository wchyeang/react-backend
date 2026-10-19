import { useRef, useCallback, useEffect } from 'react';

const MAX_PARTICLES = 80;
const FONT_SIZE = 18;
const SPAWN_DISTANCE = 10;
const MAX_LIFE = 80;

const EMOJI_RANGES: [number, number][] = [
  [0x1f600, 0x1f64f],
  [0x1f300, 0x1f5ff],
  [0x1f680, 0x1f6c5],
  [0x1f900, 0x1f9ff],
];

function randomEmoji(): string {
  const range = EMOJI_RANGES[Math.floor(Math.random() * EMOJI_RANGES.length)];
  const codePoint = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
  return String.fromCodePoint(codePoint);
}

export function useTextRainTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);

  const widthRef = useRef(window.innerWidth);
  const heightRef = useRef(window.innerHeight);
  const pointerRef = useRef({ x: 0.5 * window.innerWidth, y: 0.5 * window.innerHeight });
  const lastSpawnRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<
    { x: number; y: number; emoji: string; speed: number; life: number }[]
  >([]);

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
    particlesRef.current = [];
    lastSpawnRef.current = { x: -1000, y: -1000 };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctxRef.current = canvas.getContext('2d');
    setupCanvas();

    function trySpawn() {
      const dx = pointerRef.current.x - lastSpawnRef.current.x;
      const dy = pointerRef.current.y - lastSpawnRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < SPAWN_DISTANCE) return;

      const particles = particlesRef.current;
      if (particles.length >= MAX_PARTICLES) {
        particles.shift();
      }
      const count = dist > 60 ? 3 : 1;
      for (let c = 0; c < count; c++) {
        particles.push({
          x: pointerRef.current.x + (Math.random() - 0.5) * 40,
          y: pointerRef.current.y + (Math.random() - 0.5) * 10,
          emoji: randomEmoji(),
          speed: 1 + Math.random() * 2,
          life: MAX_LIFE,
        });
      }
      lastSpawnRef.current.x = pointerRef.current.x;
      lastSpawnRef.current.y = pointerRef.current.y;
    }

    const tick = () => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;
      const w = widthRef.current;
      const h = heightRef.current;

      ctx.clearRect(0, 0, w, h);
      ctx.font = `${FONT_SIZE}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.y += p.speed;
        p.life--;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life / MAX_LIFE;
        ctx.fillText(p.emoji, p.x, p.y);
      }
      ctx.globalAlpha = 1;

      if (particles.length === 0) {
        runningRef.current = false;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const handleMove = (eX: number, eY: number) => {
      pointerRef.current.x = eX;
      pointerRef.current.y = eY;
      trySpawn();
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
    };
  }, [setupCanvas]);

  return { canvasRef };
}
