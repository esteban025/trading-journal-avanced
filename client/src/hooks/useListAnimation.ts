import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Anima en stagger los hijos directos del elemento referenciado
 * la primera vez que `items` pasa de vacío a tener elementos.
 *
 * Compatible con cualquier elemento (div, tbody, etc.).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useListAnimation<T>(items: T[]): React.RefObject<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || items.length === 0 || animated.current) return;

    animated.current = true;
    const children = Array.from(el.children);
    if (children.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.from(children, {
        opacity: 0,
        y: 12,
        duration: 0.35,
        stagger: 0.045,
        ease: 'power2.out',
        clearProps: 'all',
      });
    }, el);

    return () => ctx.revert();
  }, [items]);

  return ref;
}
