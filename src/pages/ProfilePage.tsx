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

type BusinessCardBook = {
  id: string;
  position: number;
  book: Book | null;
};

type ReadingRecord = {
  id: string;
  finished_date: string;
  pages: number | null;
  book: Book | null;
};

const STATUS_LABELS: Record<string, string> = {
  finished: "読破",
  reading: "読書中",
  want: "積読",
  owned: "購入予定",
};

const STATUS_ORDER = ["finished", "reading", "want", "owned"];

export default function ProfilePage({
  userId,
  currentUserId,
  onBack,
  onBookSelect,
  onLogout,
}: {
  userId: string;
  currentUserId: string;
  onBack: () => void;
  onBookSelect: (book: Book) => void;
  onLogout: () => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [businessBooks, setBusinessBooks] = useState<BusinessCardBook[]>([]);
  const [readingRecords, setReadingRecords] = useState<ReadingRecord[]>([]);
  const [saving, setSaving] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const isMe = userId === currentUserId;

  useEffect(() => {
    loadProfile();
    loadReviews();
    loadUserBooks();
    loadBusinessCardBooks();
    loadReadingRecords();
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

  async function loadBusinessCardBooks() {
    const { data, error } = await supabase
      .from("business_card_books")
      .select("id,book_id,position")
      .eq("user_id", userId)
      .order("position", { ascending: true });

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
          position: item.position,
          book,
        };
      })
    );

    setBusinessBooks(withBooks);
  }

  async function loadReadingRecords() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .slice(0, 10);

    const { data, error } = await supabase
      .from("reading_records")
      .select("id,book_id,finished_date,pages")
      .eq("user_id", userId)
      .gte("finished_date", firstDay)
      .order("finished_date", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const withBooks = await Promise.all(
      (data ?? []).map(async (record) => {
        const { data: book } = await supabase
          .from("books")
          .select("id,title,author_name")
          .eq("id", record.book_id)
          .maybeSingle();

        return {
          id: record.id,
          finished_date: record.finished_date,
          pages: record.pages,
          book,
        };
      })
    );

    setReadingRecords(withBooks);
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

  async function removeBusinessCardBook(id: string) {
    const ok = confirm("名刺がわりの10冊から削除しますか？");
    if (!ok) return;

    const { error } = await supabase
      .from("business_card_books")
      .delete()
      .eq("id", id)
      .eq("user_id", currentUserId);

    if (error) {
      alert(error.message);
      return;
    }

    loadBusinessCardBooks();
  }

  const monthlyBookCount = readingRecords.length;
  const monthlyPages = readingRecords.reduce(
    (sum, record) => sum + (record.pages ?? 0),
    0
  );

  return (
    <main className="page">
      <button className="secondary" onClick={onBack}>
        ← 戻る
      </button>

      <section className="card" style={{ marginTop: 16 }}>
        <h1>{profile?.username || profile?.email || "ユーザー"}</h1>

        <p className="muted">
          フォロワー: {followersCount} / フォロー中: {followingCount}
        </p>

        {!isMe && (
          <button
            onClick={toggleFollow}
            className={isFollowing ? "secondary" : "primary"}
          >
            {isFollowing ? "フォロー解除" : "フォロー"}
          </button>
        )}

        {isMe && (
          <form onSubmit={saveProfile} style={{ display: "grid", gap: 8 }}>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザー名"
            />

            <button className="primary" type="submit" disabled={saving}>
              {saving ? "保存中..." : "プロフィールを保存"}
            </button>
          </form>
        )}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>今月の読書記録</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="card">
            <div className="muted">読了冊数</div>
            <strong style={{ fontSize: 28 }}>{monthlyBookCount}</strong> 冊
          </div>

          <div className="card">
            <div className="muted">読了ページ数</div>
            <strong style={{ fontSize: 28 }}>{monthlyPages}</strong> ページ
          </div>
        </div>

        {readingRecords.length === 0 ? (
          <p className="muted" style={{ marginTop: 12 }}>
            今月の読書記録はまだありません。
          </p>
        ) : (
          readingRecords.map((record) => (
            <button
              key={record.id}
              className="book-card"
              onClick={() => record.book && onBookSelect(record.book)}
            >
              <strong>{record.book?.title ?? "不明な本"}</strong>
              <div className="muted">{record.book?.author_name}</div>
              <div style={{ marginTop: 6 }}>
                {record.finished_date} / {record.pages ?? 0}ページ
              </div>
            </button>
          ))
        )}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>名刺がわりの10冊</h2>

        {businessBooks.length === 0 ? (
          <p className="muted">まだ登録されていません。</p>
        ) : (
          businessBooks.map((item, index) => (
            <div key={item.id} className="book-card">
              <button
                onClick={() => item.book && onBookSelect(item.book)}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <strong>
                  {index + 1}. {item.book?.title ?? "不明な本"}
                </strong>
                <div className="muted">{item.book?.author_name}</div>
              </button>

              {isMe && (
                <button
                  className="secondary"
                  onClick={() => removeBusinessCardBook(item.id)}
                  style={{ marginTop: 8 }}
                >
                  削除
                </button>
              )}
            </div>
          ))
        )}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>読書ステータス</h2>

        {STATUS_ORDER.map((status) => {
          const items = userBooks.filter((item) => item.status === status);

          return (
            <div key={status} style={{ marginTop: 16 }}>
              <h3>
                {STATUS_LABELS[status]}：{items.length}冊
              </h3>

              {items.length === 0 ? (
                <p className="muted">まだありません。</p>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    className="book-card"
                    onClick={() => item.book && onBookSelect(item.book)}
                  >
                    <strong>{item.book?.title ?? "不明な本"}</strong>
                    <div className="muted">{item.book?.author_name}</div>
                  </button>
                ))
              )}
            </div>
          );
        })}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>{isMe ? "自分のレビュー" : "このユーザーのレビュー"}</h2>

        {reviews.length === 0 ? (
          <p className="muted">まだレビューはありません。</p>
        ) : (
          reviews.map((review) => (
            <button
              key={review.id}
              className="book-card"
              onClick={() => review.book && onBookSelect(review.book)}
            >
              <strong>{review.book?.title ?? "不明な本"}</strong>
              <div className="muted">{review.book?.author_name}</div>
              <div>{"★".repeat(review.rating)}</div>
              <p>{review.body}</p>
            </button>
          ))
        )}
      </section>

      {isMe && (
        <button
          className="secondary"
          onClick={onLogout}
          style={{ width: "100%", marginTop: 24 }}
        >
          ログアウト
        </button>
      )}
    </main>
  );
}