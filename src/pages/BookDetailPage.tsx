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
  userId: string;
  onBack: () => void;
};

export default function BookDetailPage({ book, userId, onBack }: Props) {
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

  return (
    <div style={{ padding: 24 }}>
      <button onClick={onBack}>戻る</button>

      <h1>{book.title}</h1>
      <p>{book.author_name}</p>

      <form onSubmit={submitReview}>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}★
            </option>
          ))}
        </select>

        <textarea value={body} onChange={(e) => setBody(e.target.value)} />

        <button type="submit">投稿</button>
      </form>

      {reviews.map((r) => (
        <div key={r.id}>
          {r.body}（{r.rating}★）
        </div>
      ))}
    </div>
  );
}