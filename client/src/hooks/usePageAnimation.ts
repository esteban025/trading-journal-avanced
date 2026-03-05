import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function usePageAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.from(ref.current, {
      opacity: 0,
      y: 14,
      duration: 0.35,
      ease: 'power2.out',
      clearProps: 'all',
    });
  }, []);
  return ref;
}
