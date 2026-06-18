/**
 * ScrollFloat — React Bits inspired component
 * Floats text/elements with a spring-like parallax effect on scroll.
 * Uses framer-motion.
 */
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function ScrollFloat({
  children,
  className = '',
  delay = 0,
  duration = 0.8,
  floatAmount = 50,
  threshold = 0.2,
  once = true,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        y: floatAmount,
        filter: 'blur(6px)',
      }}
      animate={
        isInView
          ? {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: {
                type: 'spring',
                damping: 20,
                stiffness: 90,
                delay,
                duration,
              },
            }
          : {
              opacity: 0,
              y: floatAmount,
              filter: 'blur(6px)',
            }
      }
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  );
}
