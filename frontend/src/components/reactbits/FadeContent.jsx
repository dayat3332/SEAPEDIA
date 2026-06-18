/**
 * FadeContent — React Bits inspired component
 * Smooth fade-in wrapper with optional blur, triggered on scroll.
 * Uses framer-motion.
 */
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function FadeContent({
  children,
  className = '',
  delay = 0,
  duration = 0.6,
  blur = false,
  threshold = 0.1,
  once = true,
  initialOpacity = 0,
  direction = 'up', // 'up' | 'down' | 'left' | 'right' | 'none'
  distance = 24,
  style = {},
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  const getDirectionOffset = () => {
    switch (direction) {
      case 'up': return { y: distance };
      case 'down': return { y: -distance };
      case 'left': return { x: distance };
      case 'right': return { x: -distance };
      case 'none':
      default: return {};
    }
  };

  const hiddenState = {
    opacity: initialOpacity,
    ...getDirectionOffset(),
    ...(blur ? { filter: 'blur(10px)' } : {}),
  };

  const visibleState = {
    opacity: 1,
    x: 0,
    y: 0,
    ...(blur ? { filter: 'blur(0px)' } : {}),
    transition: {
      duration,
      delay,
      ease: [0.25, 0.1, 0.25, 1],
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, willChange: 'transform, opacity, filter' }}
      initial={hiddenState}
      animate={isInView ? visibleState : hiddenState}
    >
      {children}
    </motion.div>
  );
}
