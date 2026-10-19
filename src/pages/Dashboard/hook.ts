import { useEffect, useState, useRef } from 'react';
import { useIntl } from 'react-intl';
import { useAppSelector } from '@/store/hooks';

interface OrderRecord {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: string;
}

export function useDashboard() {
  const intl = useIntl();
  const themeMode = useAppSelector((state) => state.settings.theme);
  const isDark = themeMode === 'dark';

  const stats = [
    {
      title: intl.formatMessage({ id: 'sidebar.users' }),
      value: '12,846',
      color: '#1890ff',
      growth: 12.5,
      iconBg: 'rgba(24,144,255,0.12)',
    },
    {
      title: intl.formatMessage({ id: 'sidebar.orders' }),
      value: '3,842',
      color: '#52c41a',
      growth: -3.2,
      iconBg: 'rgba(82,196,26,0.12)',
    },
    {
      title: intl.formatMessage({ id: 'home.revenue' }),
      value: '$89,760',
      color: '#faad14',
      growth: 8.1,
      iconBg: 'rgba(250,173,20,0.12)',
    },
    {
      title: intl.formatMessage({ id: 'home.growth' }),
      value: '23.6%',
      color: '#722ed1',
      growth: 5.7,
      iconBg: 'rgba(114,46,209,0.12)',
    },
  ];

  const orders: OrderRecord[] = [
    { id: '1001', customer: 'John Doe', product: 'Laptop Pro', amount: 1299, status: 'completed' },
    {
      id: '1002',
      customer: 'Jane Smith',
      product: 'Wireless Mouse',
      amount: 49,
      status: 'pending',
    },
    {
      id: '1003',
      customer: 'Mike Johnson',
      product: 'Monitor 27"',
      amount: 399,
      status: 'completed',
    },
    { id: '1004', customer: 'Sarah Wilson', product: 'Keyboard', amount: 89, status: 'processing' },
    { id: '1005', customer: 'Tom Brown', product: 'Headphones', amount: 159, status: 'completed' },
  ];

  return { stats, orders, isDark, intl };
}

export type { OrderRecord };

interface PerfMetrics {
  fps: number;
  fpsPercent: number;
  memoryUsed: number;
  memoryPercent: number;
  domNodes: number;
  domStatusColor: string;
  pageLoadTime: number;
  pageLoadColor: string;
}

const initialPerf: PerfMetrics = {
  fps: 60,
  fpsPercent: 100,
  memoryUsed: 0,
  memoryPercent: 0,
  domNodes: 0,
  domStatusColor: 'green',
  pageLoadTime: 0,
  pageLoadColor: 'green',
};

function getDomStatusColor(count: number) {
  if (count < 1000) return 'green';
  if (count < 2000) return 'orange';
  return 'red';
}

function getLoadColor(loadTime: number) {
  if (loadTime === 0) return 'green';
  if (loadTime < 2000) return 'green';
  if (loadTime < 4000) return 'orange';
  return 'red';
}

export function usePerformanceMonitor() {
  const [perf, setPerf] = useState<PerfMetrics>(initialPerf);
  const lastTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const rafRef = useRef(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    lastTimeRef.current = performance.now();

    function measurePageLoad() {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (entries.length > 0 && entries[0] && entries[0].loadEventEnd > 0) {
        const nav = entries[0];
        const loadTime = nav.loadEventEnd - nav.startTime;
        setPerf((prev) => ({
          ...prev,
          pageLoadTime: Math.round(loadTime),
          pageLoadColor: getLoadColor(loadTime),
        }));
      }
    }

    function measureMemory() {
      const mem = (
        performance as {
          memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
        }
      ).memory;
      if (mem) {
        const usedMB = mem.usedJSHeapSize / (1024 * 1024);
        const limitMB = mem.jsHeapSizeLimit / (1024 * 1024);
        setPerf((prev) => ({
          ...prev,
          memoryUsed: Math.round(usedMB),
          memoryPercent: Math.round((usedMB / limitMB) * 100),
        }));
      }
    }

    function measureDOM() {
      const count = document.querySelectorAll('*').length;
      setPerf((prev) => ({
        ...prev,
        domNodes: count,
        domStatusColor: getDomStatusColor(count),
      }));
    }

    function tickFPS() {
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        setPerf((prev) => ({
          ...prev,
          fps: Math.min(fps, 60),
          fpsPercent: Math.round((Math.min(fps, 60) / 60) * 100),
        }));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      if (mountedRef.current) {
        rafRef.current = requestAnimationFrame(tickFPS);
      }
    }

    measurePageLoad();
    measureMemory();
    measureDOM();
    rafRef.current = requestAnimationFrame(tickFPS);

    const timer = setInterval(() => {
      measureMemory();
      measureDOM();
    }, 2000);

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(rafRef.current);
      clearInterval(timer);
    };
  }, []);

  return perf;
}
