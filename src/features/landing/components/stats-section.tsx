'use client';

import { useEffect, useRef } from 'react';

interface Stat {
  target: number;
  suffix?: string;
  label: string;
}

const STATS: Stat[] = [
  { target: 2400, label: 'Fidèles actifs' },
  { target: 50, label: 'Paroisses' },
  { target: 7, label: 'Diocèses' },
  { target: 99.9, suffix: '%', label: 'Uptime' },
];

function formatValue(val: number, target: number, suffix?: string): string {
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k+`;
  if (suffix) return `${val}${suffix}`;
  return String(val);
}

function formatFinal(target: number, suffix?: string): string {
  if (target >= 1000) return `${(target / 1000).toFixed(1)}k+`;
  if (suffix) return `${target}${suffix}`;
  return String(target);
}

function StatCounter({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || animated.current) return;
        animated.current = true;
        obs.disconnect();

        const dur = 1500;
        const start = Date.now();
        const step = () => {
          const p = Math.min((Date.now() - start) / dur, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          const val = Math.floor(ease * stat.target);
          el.textContent = formatValue(val, stat.target, stat.suffix);
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = formatFinal(stat.target, stat.suffix);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [stat.target, stat.suffix]);

  return <div ref={ref}>0</div>;
}

export function StatsSection() {
  return (
    <section className="border-y border-border py-16">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="p-6 text-center">
              <div className="mb-1.5 font-serif text-4xl font-bold text-primary lg:text-5xl">
                <StatCounter stat={stat} />
              </div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
