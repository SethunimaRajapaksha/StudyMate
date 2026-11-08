import { useState } from "react";
import { Star } from "lucide-react";

export default function StarInput({ value = 0, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => setHover(0)}
      role="radiogroup"
      aria-label="Rate this note"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          disabled={disabled}
          onMouseEnter={() => !disabled && setHover(n)}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Star size={30} className={n <= shown ? "fill-gold text-gold" : "text-brand-border"} />
        </button>
      ))}
    </div>
  );
}