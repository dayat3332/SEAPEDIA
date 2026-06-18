/**
 * GradientText — React Bits inspired component
 * Animated gradient sweep on text. Pure CSS animation, no external deps.
 */

export default function GradientText({
  children,
  className = '',
  colors = ['#a5b4fc', '#e0e7ff', '#c4b5fd', '#e879f9', '#a5b4fc'],
  animationSpeed = 6,
  showBorder = false,
}) {
  const gradientColors = colors.join(', ');

  const gradientStyle = {
    backgroundImage: `linear-gradient(90deg, ${gradientColors})`,
    backgroundSize: '300% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: `gradient-sweep ${animationSpeed}s ease-in-out infinite alternate`,
  };

  const borderStyle = showBorder
    ? {
        padding: '0.4em 0.8em',
        borderRadius: '0.75rem',
        position: 'relative',
        display: 'inline-block',
      }
    : { display: 'inline' };

  return (
    <>
      <style>
        {`@keyframes gradient-sweep {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }`}
      </style>
      <span className={className} style={{ ...borderStyle, ...gradientStyle }}>
        {children}
      </span>
    </>
  );
}
