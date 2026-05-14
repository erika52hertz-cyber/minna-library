import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Book = {
  id: string;
  title: string;
  author_name: string;
};

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    async function loadBooks() {
      const { data, error } = await supabase
        .from("books")
        .select("id,title,author_name")
        .limit(20);

      if (error) {
        console.error(error);
        return;
      }

      setBooks(data ?? []);
    }

    loadBooks();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>みんなの図書館</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        読書好きが本音でつながる、みんなの本棚型レビューサービス
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