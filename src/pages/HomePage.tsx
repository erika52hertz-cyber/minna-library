import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import BookDetailPage from "./BookDetailPage";

type Book = {
  id: string;
  title: string;
  author_name: string;
};

export default function HomePage({ userId }: { userId: string }) {
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
    return (
      <BookDetailPage
        book={selectedBook}
        userId={userId}
        onBack={() => setSelectedBook(null)}
      />
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>みんなの図書館</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadBooks(keyword);
        }}
        style={{ marginBottom: 16 }}
      >
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="検索"
        />
        <button type="submit">検索</button>
      </form>

      {books.map((book) => (
        <div key={book.id} onClick={() => setSelectedBook(book)}>
          {book.title} / {book.author_name}
        </div>
      ))}
    </div>
  );
}