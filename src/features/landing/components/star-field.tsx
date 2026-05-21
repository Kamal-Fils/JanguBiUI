'use client';

import { useEffect, useRef } from 'react';

export function StarField() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    for (let i = 0; i < 80; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      const sz = Math.random() * 2 + 0.5;
      s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-duration:${2 + Math.random() * 4}s;animation-delay:${Math.random() * 4}s;`;
      container.appendChild(s);
    }
    return () => {
      container.innerHTML = '';
    };
  }, []);

  return <div ref={ref} className="pointer-events-none absolute inset-0" />;
}
