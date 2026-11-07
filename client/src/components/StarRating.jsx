import { Star } from "lucide-react";

export default function StarRating({ value = 0, size = 16 }) {
  const rounded = Math.round(value);

  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= rounded ? "fill-gold text-gold" : "text-brand-border"}
        />
      ))}
    </div>
  );
}