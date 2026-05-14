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
  const [username, setUsername] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [saving, setSaving] = useState(false);

  async function loadProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("id,username,email")
      .eq("id", userId)
      .maybeSingle();

    setProfile(data);
    setUsername(data?.username ?? "");
  }

  async function loadReviews() {
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

  useEffect(() => {
    loadProfile();
    loadReviews();
  }, [userId]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();

    if (!username.trim()) {
      alert("ユーザー名を入力してください");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        username: username.trim(),
        email: profile?.email ?? null,
      });

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("プロフィールを保存しました");
    loadProfile();
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <button onClick={onBack}>← ホームへ戻る</button>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 16,
          padding: 20,
          background: "white",
          marginTop: 20,
        }}
      >
        <h1>プロフィール</h1>

        <p style={{ color: "#666" }}>
          現在の表示名：{profile?.username || "未設定"}
        </p>

        <form onSubmit={saveProfile} style={{ display: "grid", gap: 8 }}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ユーザー名"
            style={{
              padding: 10,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          />

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: 10,
              border: "none",
              borderRadius: 8,
              background: "#92400e",
              color: "white",
              fontWeight: "bold",
            }}
          >
            {saving ? "保存中..." : "プロフィールを保存"}
          </button>
        </form>
      </section>

      <section style={{ marginTop: 24 }}>
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
                }
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
          ))
        )}
      </section>
    </div>
  );
}