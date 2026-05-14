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
  rating: number;
  body: string;
  created_at: string;
  books: Book | null;
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
      // プロフィール取得
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id,username,email")
        .eq("id", userId)
        .maybeSingle();

      setProfile(profileData);

      // 🔥 修正ポイント（JOINを明示）
      const { data: reviewData, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          body,
          created_at,
          books:book_id (
            id,
            title,
            author_name
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setReviews((reviewData ?? []) as Review[]);
    }

    load();
  }, [userId]);

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <button onClick={onBack}>← 戻る</button>

      <h1>{profile?.username || profile?.email || "ユーザー"}</h1>

      <h2>レビュー</h2>

      {reviews.length === 0 ? (
        <p>まだレビューはありません</p>
      ) : (
        reviews.map((review) => (
          <button
            key={review.id}
            onClick={() => {
              console.log(review.books); // ← デバッグ用
              if (review.books) {
                onBookSelect(review.books);
              }
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: 12,
              marginTop: 8,
              border: "1px solid #ddd",
              cursor: review.books ? "pointer" : "default",
            }}
          >
            <strong>{review.books?.title ?? "不明な本"}</strong>
            <p>{review.books?.author_name}</p>
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