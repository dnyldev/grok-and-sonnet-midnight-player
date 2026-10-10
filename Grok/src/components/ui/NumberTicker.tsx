import { useEffect, useRef, useState } from "react";

export function NumberTicker({
  value,
  duration = 0.45,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    const delta = value - start;
    if (delta === 0) return;
    const t0 = performance.now();
    const ms = duration * 1000;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(start + delta * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{shown}</span>;
}
