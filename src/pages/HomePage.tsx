import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const [books, setBooks] = useState<any[]>([]);

  useEffect(() => {
    async function loadBooks() {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .limit(10);

      if (error) {
        console.error(error);
        return;
      }

      setBooks(data ?? []);
    }

    loadBooks();
  }, []);

  return (
    <div style={{ padding: 40, color: "black" }}>
      <h1>みんなの図書館</h1>
      <p>取得した本: {books.length}冊</p>

      {books.map((book) => (
        <div key={book.id} style={{ marginTop: 12 }}>
          {book.title} / {book.author_name}
        </div>
      ))}
    </div>
  );
}