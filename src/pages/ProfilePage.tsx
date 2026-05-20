import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  username: string | null;
  email: string | null;
  plan: "free" | "premium" | null;
};

type Book = {
  id: string;
  title: string;
  author_name: string;
  page_count?: number | null;
};

type SavedBook = {
  id: string;
  book: Book | null;
};

type ReadingRecord = {
  id: string;
  finished_date: string;
  book: Book | null;
};

export default function ProfilePage({
  userId,
  currentUserId,
  isPremium,
  onBack,
  onBookSelect,
  onLogout,
}: {
  userId: string;
  currentUserId: string;
  isPremium: boolean;
  onBack: () => void;
  onBookSelect: (book: Book) => void;
  onLogout: () => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [readingRecords, setReadingRecords] = useState<ReadingRecord[]>([]);

  const isMe = userId === currentUserId;

  useEffect(() => {
    loadProfile();
    loadSavedBooks();
    loadReadingRecords();
  }, [userId, isPremium]);

  async function loadProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("id,username,email,plan")
      .eq("id", userId)
      .maybeSingle();

    setProfile(data as Profile | null);
  }

  async function loadSavedBooks() {
    const { data } = await supabase
      .from("saved_books")
      .select("id,book_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const withBooks = await Promise.all(
      (data ?? []).map(async (item) => {
        const { data: book } = await supabase
          .from("books")
          .select("id,title,author_name,page_count")
          .eq("id", item.book_id)
          .maybeSingle();

        return {
          id: item.id,
          book,
        };
      })
    );

    setSavedBooks(withBooks);
  }

  async function loadReadingRecords() {
    let query = supabase
      .from("reading_records")
      .select("id,book_id,finished_date")
      .eq("user_id", userId)
      .order("finished_date", { ascending: false });

    if (!isPremium) {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .slice(0, 10);

      query = query.gte("finished_date", firstDay);
    }

    const { data } = await query;

    const withBooks = await Promise.all(
      (data ?? []).map(async (record) => {
        const { data: book } = await supabase
          .from("books")
          .select("id,title,author_name,page_count")
          .eq("id", record.book_id)
          .maybeSingle();

        return {
          id: record.id,
          finished_date: record.finished_date,
          book,
        };
      })
    );

    setReadingRecords(withBooks);
  }

  return (
    <main className="page">
      <button className="secondary" onClick={onBack}>
        ← 戻る
      </button>

      <section className="card" style={{ marginTop: 16 }}>
        <h1>{profile?.username || profile?.email || "ユーザー"}</h1>

        <p className="muted">
          現在のプラン：{isPremium ? "プレミアム" : "無料"}
        </p>

        {isMe && !isPremium && (
          <p className="muted">
            無料プランでは読書レポートは今月分のみ表示されます。
          </p>
        )}
      </section>

      {/* 保存した本 */}
      {isMe && (
        <section className="card" style={{ marginTop: 16 }}>
          <h2>保存した本</h2>

          {!isPremium && (
            <p className="muted">
              保存機能はプレミアム限定です。
            </p>
          )}

          {savedBooks.length === 0 ? (
            <p className="muted">まだ保存した本はありません。</p>
          ) : (
            savedBooks.map((item) => (
              <button
                key={item.id}
                className="book-card"
                onClick={() => item.book && onBookSelect(item.book)}
              >
                <strong>{item.book?.title}</strong>
                <div className="muted">{item.book?.author_name}</div>
              </button>
            ))
          )}
        </section>
      )}

      {/* 読書記録 */}
      <section className="card" style={{ marginTop: 16 }}>
        <h2>{isPremium ? "読書記録" : "今月の読書記録"}</h2>

        {readingRecords.length === 0 ? (
          <p className="muted">まだ記録はありません。</p>
        ) : (
          readingRecords.map((record) => (
            <button
              key={record.id}
              className="book-card"
              onClick={() => record.book && onBookSelect(record.book)}
            >
              <strong>{record.book?.title}</strong>
              <div className="muted">{record.book?.author_name}</div>
              <div style={{ marginTop: 6 }}>
                {record.finished_date} / {record.book?.page_count ?? 0}ページ
              </div>
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