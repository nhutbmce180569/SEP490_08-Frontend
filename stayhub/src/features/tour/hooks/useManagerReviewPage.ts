import { useEffect, useRef, useState } from "react";
import { getToursByManager } from "../services/tour.service";
import { useReview } from "./useReview";
import type { Review } from "../types/review";

export const useManagerReviewPage = () => {
  const [tours, setTours] = useState<any[]>([]);
  const [isToursLoading, setIsToursLoading] = useState(true);
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);

  const [reviewPage, setReviewPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [dateSortOrder, setDateSortOrder] = useState<"newest" | "oldest">(
    "newest"
  );

  const [localReviews, setLocalReviews] = useState<Review[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    reviews,
    totalCount,
    isLoading,
    fetchReviewsForManager,
  } = useReview();

  // Load tours
  useEffect(() => {
    const loadTours = async () => {
      try {
        const res = await getToursByManager(1, 50);

        setTours(res.data);

        if (res.data.length > 0) {
          setSelectedTourId(res.data[0].id);
        }
      } finally {
        setIsToursLoading(false);
      }
    };

    loadTours();
  }, []);

  // Reset filter
  useEffect(() => {
    if (!selectedTourId) return;

    setReviewPage(1);
    setRatingFilter(null);
    setDateSortOrder("newest");
    setLocalReviews([]);
  }, [selectedTourId]);

  // Load review
  useEffect(() => {
    if (!selectedTourId) return;

    fetchReviewsForManager(selectedTourId, {
      page: reviewPage,
      pageSize: 5,
      rating: ratingFilter,
      sortOrder: dateSortOrder,
    });
  }, [
    selectedTourId,
    reviewPage,
    ratingFilter,
    dateSortOrder,
    fetchReviewsForManager,
  ]);

  // Merge review
  useEffect(() => {
    if (reviewPage === 1) {
      setLocalReviews(reviews);
      return;
    }

    setLocalReviews((prev) => {
      const ids = new Set(prev.map((x) => x.id));

      return [
        ...prev,
        ...reviews.filter((x) => !ids.has(x.id)),
      ];
    });
  }, [reviews, reviewPage]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoading &&
          localReviews.length < totalCount
        ) {
          setReviewPage((p) => p + 1);
        }
      },
      { threshold: 1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [isLoading, localReviews.length, totalCount]);

  return {
    tours,
    isToursLoading,

    selectedTourId,
    setSelectedTourId,

    reviewPage,
    setReviewPage,

    ratingFilter,
    setRatingFilter,

    dateSortOrder,
    setDateSortOrder,

    localReviews,
    setLocalReviews,

    totalCount,
    isLoading,

    observerTarget,
  };
};