import { useState } from 'react';



export default function StarRating({ value, onRate, readOnly = false }) {
  const [hover, setHover] = useState(0);
  const display = hover || value || 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`text-2xl leading-none transition-colors ${
            readOnly ? 'cursor-default' : 'cursor-pointer'
          } ${star <= display ? 'text-amber-400' : 'text-slate-300'}`}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}