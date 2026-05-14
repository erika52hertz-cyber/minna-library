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

type UserBook = {
  id: string;
  status: string;
  book: Book | null;
};

const STATUS_LABELS: Record<string, string> = {
  finished: "読破",
  reading: "読書中",
  want: "積読",
  owned: "購入予定",
};

export default function ProfilePage({
  userId,
  currentUserId,
  onBack,
  onBookSelect,
}: {
  userId: string;
  currentUserId: string;
  onBack: () => void;
  onBookSelect: (book: Book) => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [saving, setSaving] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const isMe = userId === currentUserId;

  useEffect(() => {
    loadProfile();
    loadReviews();
    loadUserBooks();
    loadFollowState();
  }, [userId, currentUserId]);

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

        return { ...review, book };
      })
    );

    setReviews(withBooks);
  }

  async function loadUserBooks() {
    const { data, error } = await supabase
      .from("user_books")
      .select("id,status,book_id")
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      return;
    }

    const withBooks = await Promise.all(
      (data ?? []).map(async (item) => {
        const { data: book } = await supabase
          .from("books")
          .select("id,title,author_name")
          .eq("id", item.book_id)
          .maybeSingle();

        return {
          id: item.id,
          status: item.status,
          book,
        };
      })
    );

    setUserBooks(withBooks);
  }

  async function loadFollowState() {
    const { count: followers } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    const { count: following } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    setFollowersCount(followers ?? 0);
    setFollowingCount(following ?? 0);

    if (!isMe) {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", userId)
        .maybeSingle();

      setIsFollowing(!!data);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();

    if (!username.trim()) {
      alert("ユーザー名を入力してください");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("profiles").upsert({
      id: currentUserId,
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

  async function toggleFollow() {
    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", userId);

      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("follows").insert({
        follower_id: currentUserId,
        following_id: userId,
      });

      if (error) {
        alert(error.message);
        return;
      }
    }

    await loadFollowState();
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <button onClick={onBack}>← 戻る</button>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 16,
          padding: 20,
          background: "white",
          marginTop: 20,
        }}
      >
        <h1>{profile?.username || profile?.email || "ユーザー"}</h1>

        <p style={{ color: "#666" }}>
          フォロワー: {followersCount} / フォロー中: {followingCount}
        </p>

        {!isMe && (
          <button
            onClick={toggleFollow}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #ddd",
              background: isFollowing ? "white" : "#92400e",
              color: isFollowing ? "#333" : "white",
              cursor: "pointer",
            }}
          >
            {isFollowing ? "フォロー解除" : "フォロー"}
          </button>
        )}

        {isMe && (
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
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>読書ステータス</h2>

        {userBooks.length === 0 ? (
          <p style={{ color: "#777" }}>まだ登録された本はありません。</p>
        ) : (
          userBooks.map((item) => (
            <button
              key={item.id}
              onClick={() => item.book && onBookSelect(item.book)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: 16,
                marginTop: 12,
                border: "1px solid #ddd",
                borderRadius: 12,
                background: "white",
                cursor: item.book ? "pointer" : "default",
              }}
            >
              <strong>{item.book?.title ?? "不明な本"}</strong>
              <p>{item.book?.author_name}</p>
              <span style={{ color: "#92400e", fontWeight: "bold" }}>
                {STATUS_LABELS[item.status] ?? item.status}
              </span>
            </button>
          ))
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>{isMe ? "自分のレビュー" : "このユーザーのレビュー"}</h2>

        {reviews.length === 0 ? (
          <p>まだレビューはありません</p>
        ) : (
          reviews.map((review) => (
            <button
              key={review.id}
              onClick={() => {
                if (review.book) onBookSelect(review.book);
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