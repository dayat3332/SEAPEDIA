/**
 * ScrollReveal — React Bits inspired component
 * Reveals children with fade/slide animation when scrolled into viewport.
 * Uses framer-motion.
 */
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  duration = 0.6,
  origin = 'bottom', // 'bottom' | 'left' | 'right' | 'top'
  distance = 40,
  threshold = 0.1,
  once = true,
  blur = false,
  scale = false,
  staggerChildren = 0,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  const getOriginTransform = () => {
    switch (origin) {
      case 'top': return { y: -distance };
      case 'left': return { x: -distance };
      case 'right': return { x: distance };
      case 'bottom':
      default: return { y: distance };
    }
  };

  const hiddenState = {
    opacity: 0,
    ...getOriginTransform(),
    ...(blur ? { filter: 'blur(8px)' } : {}),
    ...(scale ? { scale: 0.95 } : {}),
  };

  const visibleState = {
    opacity: 1,
    x: 0,
    y: 0,
    ...(blur ? { filter: 'blur(0px)' } : {}),
    ...(scale ? { scale: 1 } : {}),
    transition: {
      duration,
      delay,
      ease: [0.25, 0.1, 0.25, 1],
      ...(staggerChildren > 0 ? { staggerChildren } : {}),
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={hiddenState}
      animate={isInView ? visibleState : hiddenState}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}
