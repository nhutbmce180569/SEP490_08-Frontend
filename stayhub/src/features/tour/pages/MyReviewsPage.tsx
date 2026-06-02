import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  MessageSquare,
  Calendar,
  CornerDownRight,
  Loader2,
  Map,
  ArrowRight,
} from "lucide-react";
import { useReview } from "../hooks/useReview"; // Chỉnh lại đường dẫn tới hook
import { PATH } from "../../../config/routes/route"; // Chỉnh lại đường dẫn tới route

export const MyReviewsPage: React.FC = () => {
  const { myAllReviews, isLoading, error, fetchAllMyReviews } = useReview();

  useEffect(() => {
    fetchAllMyReviews();
  }, [fetchAllMyReviews]);

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl bg-white shadow-sm border border-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm font-medium text-slate-500">
          Loading your reviews...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-3xl bg-white shadow-sm border border-slate-100 p-6 text-center">
        <p className="text-rose-500 font-semibold">{error}</p>
        <button
          onClick={() => fetchAllMyReviews()}
          className="mt-2 text-sm font-medium text-brand hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Review List */}
      {myAllReviews && myAllReviews.length > 0 ? (
        <div className="flex flex-col gap-5">
          {myAllReviews.map((review) => (
            <div
              key={review.id}
              className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm transition-all hover:shadow-md"
            >
              {/* Thông tin Tour được Review */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-brand">
                    <Map className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {/* 💥 Hiển thị tên Tour, nếu lỗi không có tên thì fallback về ID */}
                      {review.tourName || `Tour #${review.tourId}`}
                    </h3>
                    {review.createdAt && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Nút xem lại chi tiết Tour */}
                <Link
                  to={`/tours/${review.tourId}`} // Tùy chỉnh route chi tiết tour của bạn (ví dụ PATH.PUBLIC.TOUR_DETAIL(review.tourId))
                  className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-brand hover:ring-brand/30"
                >
                  View Tour <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Nội dung Review của User */}
              <div className="p-6">
                <div className="mb-3 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < (review.rating || 0)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-100 text-slate-200"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-bold text-slate-700">
                    {review.rating}/5
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {review.comment || (
                    <span className="italic text-slate-400">
                      No written comment.
                    </span>
                  )}
                </p>

                {/* Khu vực Replies (Phản hồi từ Admin) */}
                {review.replies && review.replies.length > 0 && (
                  <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                    {review.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="relative ml-4 rounded-2xl bg-slate-50 p-4 sm:ml-8"
                      >
                        {/* Icon mũi tên chỉ xuống bẻ góc */}
                        <div className="absolute -left-6 top-4 text-slate-300">
                          <CornerDownRight className="h-5 w-5" />
                        </div>

                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                            <MessageSquare className="h-3 w-3" />
                          </div>
                          <span className="text-sm font-bold text-slate-900">
                            {reply.repliedBy || "Tour Operator"}
                          </span>
                          {reply.createdAt && (
                            <span className="text-xs font-medium text-slate-400">
                              • {new Date(reply.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand">
            <Star className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-slate-900">
            No reviews yet
          </h3>
          <p className="max-w-sm text-sm text-slate-500">
            You haven't reviewed any tours yet. After completing a trip, you can
            share your experience here!
          </p>
          <Link
            to={PATH.CUSTOMER.MY_BOOKINGS}
            className="mt-6 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover shadow-sm shadow-brand/20"
          >
            View My Bookings
          </Link>
        </div>
      )}
    </div>
  );
};
