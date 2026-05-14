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
      const { data } = await supabase
        .from("reviews")
        .select("id,book_id,rating,body")
        .eq("user_id", userId);

      setReviews(data ?? []);
    }

    load();
  }, [userId]);

  async function openBook(book_id: string) {
    const { data } = await supabase
      .from("books")
      .select("id,title,author_name")
      .eq("id", book_id)
      .single();

    console.log("book取得:", data);

    if (data) {
      onBookSelect(data);
    } else {
      alert("本が見つかりません");
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <button onClick={onBack}>← 戻る</button>

      <h2>自分のレビュー</h2>

      {reviews.map((r) => (
        <div
          key={r.id}
          onClick={() => openBook(r.book_id)}
          style={{
            border: "1px solid #ddd",
            padding: 12,
            marginTop: 8,
            cursor: "pointer",
          }}
        >
          <div>{"★".repeat(r.rating)}</div>
          <p>{r.body}</p>
        </div>
      ))}
    </div>
  );
}