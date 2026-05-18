import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Book = {
  id: string;
  title: string;
  author_name: string;
};

type RankingReview = {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  body: string;
  created_at: string;
  like_count: number;
  book: Book | null;
  profile: {
    username: string | null;
    email: string | null;
  } | null;
};

export default function RankingPage({
  onBack,
  onBookSelect,
  onUserSelect,
}: {
  onBack: () => void;
  onBookSelect: (book: Book) => void;
  onUserSelect: (userId: string) => void;
}) {
  const [reviews, setReviews] = useState<RankingReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, []);

  async function loadRanking() {
    setLoading(true);

    const { data: reviewData, error } = await supabase
      .from("reviews")
      .select("id,user_id,book_id,rating,body,created_at")
      .limit(50);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const withDetails = await Promise.all(
      (reviewData ?? []).map(async (review) => {
        const { count } = await supabase
          .from("review_likes")
          .select("*", { count: "exact", head: true })
          .eq("review_id", review.id);

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
          like_count: count ?? 0,
          book,
          profile,
        };
      })
    );

    setReviews(
      (withDetails as RankingReview[]).sort(
        (a, b) => b.like_count - a.like_count
      )
    );

    setLoading(false);
  }

  return (
    <main className="page">
      <section className="card">
        <button className="secondary" onClick={onBack}>
          ← ホームへ戻る
        </button>

        <h1 style={{ marginTop: 18 }}>人気レビューランキング</h1>
        <p className="muted">
          いいね数が多いレビューから順に表示しています。
        </p>
      </section>

      {loading ? (
        <p style={{ marginTop: 20 }}>読み込み中...</p>
      ) : reviews.length === 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          まだレビューがありません。
        </div>
      ) : (
        reviews.map((review, index) => {
          const name =
            review.profile?.username || review.profile?.email || "ユーザー";

          return (
            <section key={review.id} className="card" style={{ marginTop: 14 }}>
              <div
                style={{
                  fontWeight: 800,
                  color: "#b45309",
                  marginBottom: 8,
                }}
              >
                第{index + 1}位　♥ {review.like_count}
              </div>

              <button
                onClick={() => onUserSelect(review.user_id)}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  color: "#2563eb",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                {name}
              </button>

              <div style={{ marginTop: 8 }}>
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </div>

              <p style={{ marginTop: 10 }}>{review.body}</p>

              {review.book && (
                <button
                  className="secondary"
                  onClick={() => onBookSelect(review.book!)}
                >
                  {review.book.title} / {review.book.author_name}
                </button>
              )}
            </section>
          );
        })
      )}
    </main>
  );
}