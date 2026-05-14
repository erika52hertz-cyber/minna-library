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

  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    const { data } = await supabase
      .from("books")
      .select("id,title,author_name")
      .limit(50);

    setBooks(data ?? []);
  }

  async function searchBooks(q: string) {
    if (!q.trim()) {
      loadBooks();
      return;
    }

    const { data } = await supabase
      .from("books")
      .select("id,title,author_name")
      .or(`title.ilike.%${q}%,author_name.ilike.%${q}%`)
      .limit(50);

    setBooks(data ?? []);
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
    <div style={{ padding: 24 }}>
      <h1>みんなの図書館</h1>

      {/* 🔍 検索バー */}
      <input
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          searchBooks(value);
        }}
        placeholder="タイトル・著者で検索"
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          border: "1px solid #ddd",
          marginTop: 12,
        }}
      />

      {/* 📚 本一覧 */}
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