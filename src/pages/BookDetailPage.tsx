import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Book = {
  id: string;
  title: string;
  author_name: string;
};

type Review = {
  id: string;
  user_id: string;
  rating: number;
  body: string;
  created_at: string;
  like_count: number;
  liked_by_me: boolean;
  profile: {
    username: string | null;
    email: string | null;
  } | null;
};

type Props = {
  book: Book;
  userId: string;
  onBack: () => void;
  onUserClick: (userId: string) => void;
};

export default function BookDetailPage({
  book,
  userId,
  onBack,
  onUserClick,
}: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");

  async function loadReviews() {
    const { data: reviewData, error } = await supabase
      .from("reviews")
      .select("id,user_id,rating,body,created_at")
      .eq("book_id", book.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const reviewsWithDetails = await Promise.all(
      (reviewData ?? []).map(async (review) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username,email")
          .eq("id", review.user_id)
          .maybeSingle();

        const { count } = await supabase
          .from("review_likes")
          .select("*", { count: "exact", head: true })
          .eq("review_id", review.id);

        const { data: myLike } = await supabase
          .from("review_likes")
          .select("id")
          .eq("review_id", review.id)
          .eq("user_id", userId)
          .maybeSingle();

        return {
          ...review,
          profile,
          like_count: count ?? 0,
          liked_by_me: !!myLike,
        };
      })
    );

    setReviews(reviewsWithDetails);
  }

  useEffect(() => {
    loadReviews();
  }, [book.id]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();

    if (!body.trim()) {
      alert("感想を入力してください");
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      book_id: book.id,
      user_id: userId,
      rating,
      body,
      has_spoiler: false,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setBody("");
    setRating(5);
    loadReviews();
  }

  async function toggleLike(review: Review) {
    if (review.liked_by_me) {
      const { error } = await supabase
        .from("review_likes")
        .delete()
        .eq("review_id", review.id)
        .eq("user_id", userId);

      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("review_likes").insert({
        review_id: review.id,
        user_id: userId,
      });

      if (error) {
        alert(error.message);
        return;
      }
    }

    loadReviews();
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "sans-serif" }}>
      <button onClick={onBack} style={{ marginBottom: 24 }}>
        ← 戻る
      </button>

      <section style={{ border: "1px solid #ddd", borderRadius: 16, padding: 24, background: "white" }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>{book.title}</h1>
        <p style={{ color: "#666" }}>{book.author_name}</p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>レビュー投稿</h2>

        <form onSubmit={submitReview} style={{ display: "grid", gap: 12 }}>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}★
              </option>
            ))}
          </select>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="感想を書く"
            style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd", minHeight: 90 }}
          />

          <button
            type="submit"
            style={{
              padding: 12,
              borderRadius: 10,
              border: "none",
              background: "#92400e",
              color: "white",
              fontWeight: "bold",
            }}
          >
            投稿
          </button>
        </form>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>レビュー一覧</h2>

        {reviews.length === 0 ? (
          <p style={{ color: "#777" }}>まだレビューはありません。</p>
        ) : (
          reviews.map((review) => {
            const displayName =
              review.profile?.username ||
              review.profile?.email ||
              "ユーザー";

            const isMine = review.user_id === userId;

            return (
              <div
                key={review.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 12,
                  background: "white",
                }}
              >
                <button
                  type="button"
                  onClick={() => onUserClick(review.user_id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    marginBottom: 6,
                    fontSize: 13,
                    color: "#2563eb",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  {displayName}
                  {isMine ? "（自分）" : ""}
                </button>

                <div>
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </div>

                <p>{review.body}</p>

                <button
                  onClick={() => toggleLike(review)}
                  style={{
                    marginTop: 8,
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid #ddd",
                    background: review.liked_by_me ? "#fef3c7" : "white",
                    cursor: "pointer",
                  }}
                >
                  {review.liked_by_me ? "♥ いいね済み" : "♡ いいね"} {review.like_count}
                </button>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}