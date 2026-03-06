import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Anima la entrada del contenedor de un modal:
 * fade-in + scale leve + slide-up.
 * Aplícalo al div con clase `modal-box`.
 */
export function useModalAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        opacity: 0,
        scale: 0.96,
        y: 16,
        duration: 0.3,
        ease: 'back.out(1.4)',
        clearProps: 'all',
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return ref;
}
