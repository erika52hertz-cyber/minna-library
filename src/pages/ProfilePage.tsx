import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Book = {
  id: string;
  title: string;
  author_name: string;
};

type Review = {
  id: string;
  book_id: string;
  rating: number;
  body: string;
  book: Book | null;
};

export default function ProfilePage({
  userId,
  onBack,
  onBookSelect,
}: {
  userId: string;
  onBack: () => void;
  onBookSelect: (book: Book) => void;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    async function load() {
      const { data: reviewData, error } = await supabase
        .from("reviews")
        .select("id,book_id,rating,body")
        .eq("user_id", userId);

      if (error) {
        console.error(error);
        return;
      }

      const withBooks = await Promise.all(
        (reviewData ?? []).map(async (review) => {
          const { data: book } = await supabase
            .from("books")
            .select("id,title,author_name")
            .eq("id", review.book_id)
            .maybeSingle();

          return {
            ...review,
            book,
          };
        })
      );

      setReviews(withBooks);
    }

    load();
  }, [userId]);

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <button onClick={onBack}>← ホームへ戻る</button>

      <h1>プロフィール 修正版 2026-05-14</h1>
      <h2>自分のレビュー</h2>

      {reviews.map((review) => (
        <button
          key={review.id}
          onClick={() => {

            if (!review.book) {
              alert("本データが見つかりません");
              return;
            }

            onBookSelect(review.book);
          }}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: 16,
            marginTop: 12,
            border: "1px solid #ddd",
            borderRadius: 12,
            background: "white",
            cursor: "pointer",
          }}
        >
          <strong>{review.book?.title ?? "不明な本"}</strong>
          <p>{review.book?.author_name}</p>
          <div>{"★".repeat(review.rating)}</div>
          <p>{review.body}</p>
        </button>
      ))}
    </div>
  );
}