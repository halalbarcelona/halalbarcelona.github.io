import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
}

export function StarRating({ rating, size = 14, className }: StarRatingProps) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          width={size}
          height={size}
          strokeWidth={1.5}
          className={i < Math.round(rating) ? "fill-accent-400 text-accent-400" : "fill-transparent text-line"}
        />
      ))}
    </span>
  );
}
