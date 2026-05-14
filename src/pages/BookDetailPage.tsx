import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Book = {
  id: string;
  title: string;
  author_name: string;
};

type Review = {
  id: string;
  rating: number;
  body: string;
  created_at: string;
};

type Props = {
  book: Book;
  onBack: () => void;
};

export default function BookDetailPage({ book, onBack }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    async function loadReviews() {
      const { data, error } = await supabase
        .from("reviews")
        .select("id,rating,body,created_at")
        .eq("book_id", book.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setReviews(data ?? []);
    }

    loadReviews();
  }, [book.id]);

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "sans-serif" }}>
      <button onClick={onBack} style={{ marginBottom: 24 }}>
        ← 戻る
      </button>

      <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 24, background: "white" }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>{book.title}</h1>
        <p style={{ color: "#666", fontSize: 16 }}>{book.author_name}</p>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20 }}>レビュー</h2>

        {reviews.length === 0 ? (
          <p style={{ color: "#777" }}>まだレビューはありません。</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, marginTop: 12 }}>
              <div>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
              <p>{review.body}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}