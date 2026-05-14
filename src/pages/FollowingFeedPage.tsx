import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Book = {
  id: string;
  title: string;
  author_name: string;
};

type FeedReview = {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  body: string;
  created_at: string;
  book: Book | null;
  profile: {
    username: string | null;
    email: string | null;
  } | null;
};

export default function FollowingFeedPage({
  currentUserId,
  onBack,
  onBookSelect,
  onUserSelect,
}: {
  currentUserId: string;
  onBack: () => void;
  onBookSelect: (book: Book) => void;
  onUserSelect: (userId: string) => void;
}) {
  const [reviews, setReviews] = useState<FeedReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, [currentUserId]);

  async function loadFeed() {
    setLoading(true);

    const { data: follows, error: followError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId);

    if (followError) {
      console.error(followError);
      setLoading(false);
      return;
    }

    const followingIds = (follows ?? []).map((f) => f.following_id);

    if (followingIds.length === 0) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const { data: reviewData, error: reviewError } = await supabase
      .from("reviews")
      .select("id,user_id,book_id,rating,body,created_at")
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(50);

    if (reviewError) {
      console.error(reviewError);
      setLoading(false);
      return;
    }

    const withDetails = await Promise.all(
      (reviewData ?? []).map(async (review) => {
        const { data: book } = await supabase
          .from("books")
          .select("id,title,author_name")
          .eq("id", review.book_id)
          .maybeSingle();

        const { data: profile } = await supabase
          .from("profiles")
          .select("username,email")
          .eq("id", review.user_id)
          .maybeSingle();

        return {
          ...review,
          book,
          profile,
        };
      })
    );

    setReviews(withDetails as FeedReview[]);
    setLoading(false);
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <button onClick={onBack}>← ホームへ戻る</button>

      <h1>フォロー中のレビュー</h1>

      {loading ? (
        <p>読み込み中...</p>
      ) : reviews.length === 0 ? (
        <p style={{ color: "#777" }}>
          まだレビューがありません。ユーザーをフォローすると、ここにレビューが表示されます。
        </p>
      ) : (
        reviews.map((review) => {
          const displayName =
            review.profile?.username || review.profile?.email || "ユーザー";

          return (
            <div
              key={review.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 16,
                marginTop: 12,
                background: "white",
              }}
            >
              <button
                onClick={() => onUserSelect(review.user_id)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                {displayName}
              </button>

              <div style={{ marginTop: 8 }}>
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </div>

              <p>{review.body}</p>

              {review.book && (
                <button
                  onClick={() => onBookSelect(review.book!)}
                  style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    background: "#fafaf9",
                    cursor: "pointer",
                  }}
                >
                  {review.book.title} / {review.book.author_name}
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}