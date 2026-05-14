import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Book = {
  id: string;
  title: string;
  author_name: string;
};

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [keyword, setKeyword] = useState("");

  async function loadBooks(search = "") {
    let query = supabase
      .from("books")
      .select("id,title,author_name")
      .limit(50);

    if (search.trim()) {
      query = query.or(
        `title.ilike.%${search.trim()}%,author_name.ilike.%${search.trim()}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return;
    }

    setBooks(data ?? []);
  }

  useEffect(() => {
    loadBooks();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadBooks(keyword);
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>みんなの図書館</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        読書好きが本音でつながる、みんなの本棚型レビューサービス
      </p>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="タイトル・著者名で検索"
          style={{
            flex: 1,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 10,
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "12px 16px",
            border: "none",
            borderRadius: 10,
            background: "#92400e",
            color: "white",
            fontWeight: "bold",
          }}
        >
          検索
        </button>
      </form>

      <p style={{ color: "#888", fontSize: 13, marginBottom: 12 }}>
        {books.length}件
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {books.map((book) => (
          <div
            key={book.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 16,
              background: "white",
            }}
          >
            <h2 style={{ fontSize: 18, margin: 0 }}>{book.title}</h2>
            <p style={{ margin: "8px 0 0", color: "#666" }}>
              {book.author_name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}