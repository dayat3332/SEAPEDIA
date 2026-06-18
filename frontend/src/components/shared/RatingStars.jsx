import { HiStar } from 'react-icons/hi2';

export default function RatingStars({ rating, size = 16, interactive = false, onChange }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform duration-100' : 'cursor-default'}`}
        >
          <HiStar
            size={size}
            className={`transition-colors duration-150 ${
              star <= rating ? 'text-amber-400' : 'text-surface-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
