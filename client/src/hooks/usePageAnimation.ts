import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function usePageAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'all' } });

      // 1 — Fade-in + slide del contenedor completo
      tl.from(el, { opacity: 0, y: 10, duration: 0.28 });

      // 2 — Stagger de las secciones hijas (header, contenido, etc.)
      if (el.children.length > 0) {
        tl.from(el.children, {
          opacity: 0,
          y: 20,
          duration: 0.42,
          stagger: 0.07,
        }, '-=0.18');
      }
    }, el);

    return () => ctx.revert();
  }, []);

  return ref;
}
