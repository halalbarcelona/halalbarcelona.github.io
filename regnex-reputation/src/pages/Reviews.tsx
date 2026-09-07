import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageSquareOff } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Drawer } from "@/components/ui/Drawer";
import { ReviewFilters, DEFAULT_REVIEW_FILTERS, type ReviewFiltersState } from "@/components/reviews/ReviewFilters";
import { ReviewRow } from "@/components/reviews/ReviewRow";
import { ReviewDetailPanel } from "@/components/reviews/ReviewDetailPanel";
import { isWithinLastDays } from "@/lib/utils/date";

export function Reviews() {
  const reviews = useAppStore((s) => s.reviews);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ReviewFiltersState>(DEFAULT_REVIEW_FILTERS);

  const openReviewId = searchParams.get("review");
  const openReview = reviews.find((r) => r.id === openReviewId) ?? null;

  const setOpenReviewId = (id: string | null) => {
    setSearchParams(id ? { review: id } : {}, { replace: true });
  };

  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => (filters.rating === "todas" ? true : r.rating === Number(filters.rating)))
      .filter((r) => (filters.sentiment === "todas" ? true : r.sentiment === filters.sentiment))
      .filter((r) => (filters.status === "todas" ? true : r.responseStatus === filters.status))
      .filter((r) => (filters.date === "todas" ? true : isWithinLastDays(r.date, Number(filters.date))))
      .filter((r) => {
        if (!filters.search.trim()) return true;
        const q = filters.search.trim().toLowerCase();
        return r.author.toLowerCase().includes(q) || r.text.toLowerCase().includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [reviews, filters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Reseñas</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-soft">
          Todas las reseñas de Google en un solo espacio de trabajo.
        </p>
      </div>

      <Card padded={false}>
        <div className="border-b border-line-soft p-4 sm:p-5">
          <ReviewFilters value={filters} onChange={setFilters} resultCount={filteredReviews.length} />
        </div>

        {filteredReviews.length === 0 ? (
          <EmptyState
            icon={<MessageSquareOff width={22} height={22} />}
            title="Ninguna reseña coincide con estos filtros"
            description="Prueba a ajustar la búsqueda o a limpiar los filtros para ver más resultados."
          />
        ) : (
          <div className="divide-y divide-line-soft">
            {filteredReviews.map((review) => (
              <ReviewRow key={review.id} review={review} onOpen={setOpenReviewId} />
            ))}
          </div>
        )}
      </Card>

      <Drawer open={!!openReview} onClose={() => setOpenReviewId(null)}>
        {openReview && <ReviewDetailPanel review={openReview} />}
      </Drawer>
    </div>
  );
}
