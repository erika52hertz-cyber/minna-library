import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  username: string | null;
  email: string | null;
};

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
  created_at: string;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    async function load() {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id,username,email")
        .eq("id", userId)
        .maybeSingle();

      setProfile(profileData);

      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select("id,book_id,rating,body,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (reviewError) {
        console.error(reviewError);
        return;
      }

      const reviewsWithBooks = await Promise.all(
        (reviewData ?? []).map(async (review) => {
          const { data: bookData } = await supabase
            .from("books")
            .select("id,title,author_name")
            .eq("id", review.book_id)
            .maybeSingle();

          return {
            ...review,
            book: bookData,
          };
        })
      );

      setReviews(reviewsWithBooks as Review[]);
    }

    load();
  }, [userId]);

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <button onClick={onBack}>← ホームへ戻る</button>

      <h1>{profile?.username || profile?.email || "ユーザー"}</h1>

      <h2>自分のレビュー</h2>

      {reviews.length === 0 ? (
        <p>まだレビューはありません</p>
      ) : (
        reviews.map((review) => (
          <button
            key={review.id}
            onClick={() => {
              if (review.book) {
                onBookSelect(review.book);
              } else {
                alert("本データが見つかりません");
              }
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: 12,
              marginTop: 8,
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
            }}
          >
            <strong>{review.book?.title ?? "不明な本"}</strong>
            <p>{review.book?.author_name}</p>
            <div>
              {"★".repeat(review.rating)}
              {"☆".repeat(5 - review.rating)}
            </div>
            <p>{review.body}</p>
          </button>
        ))
      )}
    </div>
  );
}