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

  useEffect(() => {
    async function loadBooks() {
      const { data } = await supabase
        .from("books")
        .select("id,title,author_name")
        .limit(50);

      setBooks(data ?? []);
    }

    loadBooks();
  }, []);

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

      {books.map((book) => (
        <div
          key={book.id}
          onClick={() => onBookSelect(book)}
          style={{
            padding: 12,
            border: "1px solid #ddd",
            marginTop: 8,
            cursor: "pointer",
          }}
        >
          {book.title} / {book.author_name}
        </div>
      ))}
    </div>
  );
}