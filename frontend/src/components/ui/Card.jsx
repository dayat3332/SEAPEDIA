export default function Card({ children, className = '', hover = false, onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-surface-100 shadow-card transition-all duration-300 ease-out ${
        hover ? 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className = '' }) {
  return <div className={`px-6 pt-6 pb-2 ${className}`}>{children}</div>;
};

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return <div className={`px-6 pb-6 pt-2 border-t border-surface-100 ${className}`}>{children}</div>;
};
