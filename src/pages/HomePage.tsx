import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import BookDetailPage from "./BookDetailPage";

type Book = {
  id: string;
  title: string;
  author_name: string;
};

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  async function loadBooks(search = "") {
    let query = supabase.from("books").select("id,title,author_name").limit(50);

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

  if (selectedBook) {
    return <BookDetailPage book={selectedBook} onBack={() => setSelectedBook(null)} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf9", fontFamily: "sans-serif" }}>
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #eee",
          padding: "28px 20px 18px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <h1 style={{ fontSize: 28, margin: 0, color: "#292524" }}>
            みんなの図書館
          </h1>
          <p style={{ color: "#78716c", margin: "6px 0 18px", fontSize: 14 }}>
            読書好きが本音でつながる、みんなの本棚型レビューサービス
          </p>

          <form onSubmit={(e) => { e.preventDefault(); loadBooks(keyword); }} style={{ display: "flex", gap: 8 }}>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="タイトル・著者名で検索"
              style={{
                flex: 1,
                padding: "12px 14px",
                border: "1px solid #ddd6d1",
                borderRadius: 12,
                fontSize: 14,
                background: "#fafaf9",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "12px 18px",
                border: "none",
                borderRadius: 12,
                background: "#92400e",
                color: "white",
                fontWeight: "bold",
              }}
            >
              検索
            </button>
          </form>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: 20 }}>
        <p style={{ color: "#78716c", fontSize: 13, marginBottom: 14 }}>
          {books.length}件の本
        </p>

        <div style={{ display: "grid", gap: 14 }}>
          {books.map((book) => (
            <button
              key={book.id}
              onClick={() => setSelectedBook(book)}
              style={{
                textAlign: "left",
                border: "1px solid #e7e5e4",
                borderRadius: 18,
                padding: 18,
                background: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div
                  style={{
                    width: 48,
                    height: 64,
                    borderRadius: 10,
                    background: "#fef3c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#92400e",
                    fontWeight: "bold",
                    flexShrink: 0,
                  }}
                >
                  本
                </div>

                <div>
                  <h2 style={{ fontSize: 18, margin: 0, color: "#292524" }}>
                    {book.title}
                  </h2>
                  <p style={{ margin: "8px 0 0", color: "#78716c", fontSize: 14 }}>
                    {book.author_name}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}