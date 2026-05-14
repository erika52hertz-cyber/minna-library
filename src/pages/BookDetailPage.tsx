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

const USER_ID = "4dd8cd6c-e8fc-49e6-88fb-cfb6bef2aea0";

export default function BookDetailPage({ book, onBack }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");

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

  useEffect(() => {
    loadReviews();
  }, [book.id]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.from("reviews").insert({
      book_id: book.id,
      user_id: USER_ID,
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

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "sans-serif" }}>
      <button onClick={onBack} style={{ marginBottom: 24 }}>
        ← 戻る
      </button>

      <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 24, background: "white" }}>
        <h1 style={{ fontSize: 28 }}>{book.title}</h1>
        <p style={{ color: "#666" }}>{book.author_name}</p>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2>レビュー投稿</h2>

        <form onSubmit={submitReview} style={{ display: "grid", gap: 12 }}>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5,4,3,2,1].map(n => (
              <option key={n} value={n}>{n}★</option>
            ))}
          </select>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="感想を書く"
            style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
          />

          <button
            type="submit"
            style={{ padding: 12, borderRadius: 10, border: "none", background: "#92400e", color: "white" }}
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