import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  username: string | null;
  email: string | null;
};

type Review = {
  id: string;
  rating: number;
  body: string;
  created_at: string;
  books: {
    title: string;
    author_name: string;
  } | null;
};

export default function ProfilePage({
  userId,
  onBack,
}: {
  userId: string;
  onBack: () => void;
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

      const { data: reviewData, error } = await supabase
        .from("reviews")
        .select("id,rating,body,created_at,books(title,author_name)")
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
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "sans-serif" }}>
      <button onClick={onBack} style={{ marginBottom: 24 }}>
        ← ホームへ戻る
      </button>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 16,
          padding: 24,
          background: "white",
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0 }}>
          {profile?.username || profile?.email || "ユーザー"}
        </h1>
        <p style={{ color: "#666" }}>投稿レビュー: {reviews.length}件</p>
      </section>

      <section>
        <h2>自分のレビュー</h2>

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
                background: "white",
              }}
            >
              <strong>{review.books?.title ?? "不明な本"}</strong>
              <p style={{ color: "#666", margin: "4px 0" }}>
                {review.books?.author_name}
              </p>
              <div>
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </div>
              <p>{review.body}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}