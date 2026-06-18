/**
 * BlurText — React Bits inspired component
 * Text unblurs word-by-word with stagger for cinematic reading flow.
 * Uses framer-motion.
 */
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function BlurText({
  text = '',
  className = '',
  delay = 0.08,
  duration = 0.6,
  animateBy = 'words', // 'words' | 'chars'
  variant,
  threshold = 0.1,
  onAnimationComplete,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: threshold });

  const elements = animateBy === 'chars'
    ? text.split('')
    : text.split(' ');

  const defaultFrom = { opacity: 0, filter: 'blur(12px)', y: 10 };
  const defaultTo = {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: {
      duration,
      ease: 'easeOut',
    },
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: delay,
      },
    },
  };

  const childVariants = variant || {
    hidden: defaultFrom,
    visible: defaultTo,
  };

  return (
    <motion.span
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      onAnimationComplete={() => {
        if (isInView) onAnimationComplete?.();
      }}
      className={className}
      style={{ display: 'inline-flex', flexWrap: 'wrap' }}
    >
      {elements.map((el, i) => (
        <motion.span
          key={i}
          variants={childVariants}
          style={{
            display: 'inline-block',
            willChange: 'transform, opacity, filter',
          }}
        >
          {el === ' ' ? '\u00A0' : el}
          {animateBy === 'words' && i < elements.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </motion.span>
  );
}
