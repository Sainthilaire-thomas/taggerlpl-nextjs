// hooks/usePerformanceDebug.ts
import { useEffect, useRef, useState } from "react";

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  totalRenderTime: number;
  averageRenderTime: number;
  slowRenders: number;
  componentName: string;
}

export const usePerformanceDebug = (
  componentName: string,
  threshold: number = 16
) => {
  const renderCountRef = useRef(0);
  const startTimeRef = useRef(0);
  const totalTimeRef = useRef(0);
  const slowRendersRef = useRef(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    totalRenderTime: 0,
    averageRenderTime: 0,
    slowRenders: 0,
    componentName,
  });

  // Début du render
  startTimeRef.current = performance.now();
  renderCountRef.current += 1;

  useEffect(() => {
    // Fin du render
    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;
    totalTimeRef.current += renderTime;

    if (renderTime > threshold) {
      slowRendersRef.current += 1;
      console.warn(
        `🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(
          2
        )}ms`
      );
    }

    const newMetrics: PerformanceMetrics = {
      renderCount: renderCountRef.current,
      lastRenderTime: renderTime,
      totalRenderTime: totalTimeRef.current,
      averageRenderTime: totalTimeRef.current / renderCountRef.current,
      slowRenders: slowRendersRef.current,
      componentName,
    };

    setMetrics(newMetrics);

    // Log périodique des métriques
    if (renderCountRef.current % 10 === 0) {
      console.log(`📊 Performance metrics for ${componentName}:`, newMetrics);
    }
  });

  return metrics;
};
