import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import BookDetailPage from "./BookDetailPage";

type Book = {
  id: string;
  title: string;
  author_name: string;
};

export default function HomePage({
  userId,
  selectedBook,
  onBookSelect,
  onBack,
  onUserClick,
}: {
  userId: string;
  selectedBook: Book | null;
  onBookSelect: (book: Book) => void;
  onBack: () => void;
  onUserClick: (userId: string) => void;
}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchBooks(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function loadBooks() {
    setLoading(true);

    const { data, error } = await supabase
      .from("books")
      .select("id,title,author_name")
      .limit(50);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setBooks(data ?? []);
    setLoading(false);
  }

  async function searchBooks(q: string) {
    setLoading(true);

    if (!q.trim()) {
      await loadBooks();
      return;
    }

    const keyword = q.trim();

    const { data, error } = await supabase
      .from("books")
      .select("id,title,author_name")
      .or(`title.ilike.%${keyword}%,author_name.ilike.%${keyword}%`)
      .limit(50);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setBooks(data ?? []);
    setLoading(false);
  }

  function clearSearch() {
    setQuery("");
    loadBooks();
  }

  if (selectedBook) {
    return (
      <BookDetailPage
        book={selectedBook}
        userId={userId}
        onBack={onBack}
        onUserClick={onUserClick}
      />
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>みんなの図書館</h1>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="タイトル・著者で検索"
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        />

        {query && (
          <button
            onClick={clearSearch}
            style={{
              padding: "0 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
            }}
          >
            クリア
          </button>
        )}
      </div>

      <p style={{ color: "#666", marginTop: 12 }}>
        {loading ? "検索中..." : `${books.length}件`}
      </p>

      {!loading && books.length === 0 && (
        <div
          style={{
            padding: 24,
            marginTop: 16,
            border: "1px solid #eee",
            borderRadius: 12,
            background: "white",
            color: "#666",
          }}
        >
          該当する本が見つかりませんでした。
        </div>
      )}

      {books.map((book) => (
        <div
          key={book.id}
          onClick={() => onBookSelect(book)}
          style={{
            padding: 12,
            border: "1px solid #ddd",
            marginTop: 8,
            cursor: "pointer",
            borderRadius: 8,
            background: "white",
          }}
        >
          <strong>{book.title}</strong>
          <div style={{ color: "#666" }}>{book.author_name}</div>
        </div>
      ))}
    </div>
  );
}