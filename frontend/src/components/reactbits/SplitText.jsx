/**
 * SplitText — React Bits inspired component
 * Splits text into words/chars and animates them with stagger.
 * Uses framer-motion. No GSAP dependency.
 */
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function SplitText({
  text = '',
  className = '',
  delay = 0.05,
  duration = 0.6,
  ease = 'easeOut',
  splitBy = 'words', // 'words' | 'chars'
  from = { opacity: 0, y: 40, filter: 'blur(4px)' },
  to = { opacity: 1, y: 0, filter: 'blur(0px)' },
  threshold = 0.1,
  tag: Tag = 'p',
  onAnimationComplete,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: threshold });

  const elements = splitBy === 'chars'
    ? text.split('')
    : text.split(' ');

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: delay,
      },
    },
  };

  const childVariants = {
    hidden: from,
    visible: {
      ...to,
      transition: {
        duration,
        ease,
      },
    },
  };

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ overflow: 'hidden', display: 'inline-block' }}
    >
      <motion.span
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        onAnimationComplete={() => {
          if (isInView) onAnimationComplete?.();
        }}
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
            {splitBy === 'words' && i < elements.length - 1 && '\u00A0'}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}
