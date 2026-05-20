import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Book = {
  id: string;
  title: string;
  author_name: string;
  genre: string | null;
  cover_url?: string | null;
  page_count?: number | null;
};

export default function RecommendPage({
  userId,
  onBack,
  onBookSelect,
}: {
  userId: string;
  onBack: () => void;
  onBookSelect: (book: Book) => void;
}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [userId]);

  async function loadRecommendations() {
    setLoading(true);

    const genres = await loadUserGenres();

    if (genres.length > 0) {
      setFavoriteGenres(genres);

      const { data, error } = await supabase
        .from("books")
        .select("id,title,author_name,genre,cover_url,page_count")
        .in("genre", genres)
        .limit(20);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setBooks((data ?? []) as Book[]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("books")
      .select("id,title,author_name,genre,cover_url,page_count")
      .limit(20);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setBooks((data ?? []) as Book[]);
    setLoading(false);
  }

  async function loadUserGenres() {
    const genreSet = new Set<string>();

    const { data: saved } = await supabase
      .from("saved_books")
      .select("book_id")
      .eq("user_id", userId);

    const { data: userBooks } = await supabase
      .from("user_books")
      .select("book_id")
      .eq("user_id", userId);

    const bookIds = [
      ...(saved ?? []).map((item) => item.book_id),
      ...(userBooks ?? []).map((item) => item.book_id),
    ];

    if (bookIds.length === 0) {
      return [];
    }

    const { data: books } = await supabase
      .from("books")
      .select("genre")
      .in("id", bookIds);

    (books ?? []).forEach((book) => {
      if (book.genre) genreSet.add(book.genre);
    });

    return Array.from(genreSet).slice(0, 5);
  }

  return (
    <main className="page">
      <button className="secondary" onClick={onBack}>
        ← 戻る
      </button>

      <section className="card" style={{ marginTop: 16 }}>
        <h1>おすすめ</h1>

        {favoriteGenres.length > 0 ? (
          <p className="muted">
            あなたが保存・登録した本に近いジャンルからおすすめしています。
          </p>
        ) : (
          <p className="muted">
            保存や読書ステータスを登録すると、より自分に合った本が表示されます。
          </p>
        )}

        {favoriteGenres.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {favoriteGenres.map((genre) => (
              <span key={genre} className="tag active">
                {genre}
              </span>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 16 }}>
        {loading ? (
          <p>読み込み中...</p>
        ) : books.length === 0 ? (
          <section className="card">
            <p className="muted">おすすめできる本がまだありません。</p>
          </section>
        ) : (
          books.map((book) => (
            <button
              key={book.id}
              className="book-card"
              onClick={() => onBookSelect(book)}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    style={{
                      width: 48,
                      height: 68,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #e7e5e4",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 68,
                      borderRadius: 8,
                      background: "#fef3c7",
                      color: "#92400e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: "bold",
                      flexShrink: 0,
                    }}
                  >
                    本
                  </div>
                )}

                <div>
                  <strong>{book.title}</strong>
                  <div className="muted">{book.author_name}</div>
                  {book.genre && (
                    <div style={{ marginTop: 6, color: "#b45309", fontWeight: 700 }}>
                      {book.genre}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </section>
    </main>
  );
}