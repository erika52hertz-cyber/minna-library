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
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [page, setPage] = useState<"home" | "profile">("home");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      alert(result.error.message);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setPage("home");
    setSelectedBook(null);
  }

  if (loading) {
    return <div style={{ padding: 40 }}>読み込み中...</div>;
  }

  if (!session) {
    return (
      <div style={{ padding: 24 }}>
        <h1>みんなの図書館</h1>

        <button onClick={() => setMode("login")}>ログイン</button>
        <button onClick={() => setMode("signup")}>新規登録</button>

        <form onSubmit={submit}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メール"
            type="email"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            type="password"
          />
          <button type="submit">送信</button>
        </form>
      </div>
    );
  }

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
    <>
      <div style={{ position: "fixed", right: 16, top: 16, zIndex: 20 }}>
        <button onClick={() => setPage("profile")}>プロフィール</button>
        <button onClick={logout}>ログアウト</button>
      </div>

      {page === "home" ? (
        <HomePage
          userId={session.user.id}
          selectedBook={null}
          onBookSelect={setSelectedBook}
          onBack={() => setSelectedBook(null)}
        />
      ) : (
        <ProfilePage
          userId={session.user.id}
          onBack={() => setPage("home")}
          onBookSelect={setSelectedBook}
        />
      )}
    </>
  );
}