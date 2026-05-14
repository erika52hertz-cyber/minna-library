import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import BookDetailPage from "./pages/BookDetailPage";

type Book = {
  id: string;
  title: string;
  author_name: string;
};

export default function App() {
  const [page, setPage] = useState<"home" | "profile">("home");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  if (!session) {
    return <div>ログインしてください</div>;
  }

  // 🔥 ここが最重要（これで絶対遷移する）
  if (selectedBook) {
    return (
      <BookDetailPage
        book={selectedBook}
        userId={session.user.id}
        onBack={() => setSelectedBook(null)}
      />
    );
  }

  return (
    <div>
      <button onClick={() => setPage("home")}>ホーム</button>
      <button onClick={() => setPage("profile")}>プロフィール</button>

      {page === "home" ? (
        <HomePage
          userId={session.user.id}
          onBookSelect={setSelectedBook}
        />
      ) : (
        <ProfilePage
          userId={session.user.id}
          onBack={() => setPage("home")}
          onBookSelect={setSelectedBook}
        />
      )}
    </div>
  );
}