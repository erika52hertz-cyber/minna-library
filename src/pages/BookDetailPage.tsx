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

// 仮ユーザーID（後でログイン連動に置き換える）
const USER_ID = "4dd8cd6c-e8fc-49e6-88fb-cfb6bef2aea0";

export default function BookDetailPage({ book, onBack }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");

  // レビュー取得
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

  // レビュー投稿
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

  // レビュー削除
  async function deleteReview(id: string) {
    const ok = confirm("削除しますか？");
    if (!ok) return;

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadReviews();
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "sans-serif" }}>
      {/* 戻る */}
      <button onClick={onBack} style={{ marginBottom: 24 }}>
        ← 戻る
      </button>

      {/* 本情報 */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 16,
          padding: 24,
          background: "white",
        }}
      >
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>{book.title}</h1>
        <p style={{ color: "#666", fontSize: 16 }}>{book.author_name}</p>
      </div>

      {/* 投稿フォーム */}
      <section style={{ marginTop: 24 }}>
        <h2>レビュー投稿</h2>

        <form onSubmit={submitReview} style={{ display: "grid", gap: 12 }}>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            style={{ padding: 8 }}
          >
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
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ddd",
              minHeight: 80,
            }}
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

      {/* レビュー一覧 */}
      <section style={{ marginTop: 24 }}>
        <h2>レビュー一覧</h2>

        {reviews.length === 0 ? (
          <p style={{ color: "#777" }}>まだレビューはありません。</p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 16,
                marginTop: 12,
              }}
            >
              <div>
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </div>

              <p style={{ marginTop: 8 }}>{review.body}</p>

              <button
                onClick={() => deleteReview(review.id)}
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#c00",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                削除
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}