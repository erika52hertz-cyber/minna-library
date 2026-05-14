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
  const [viewUserId, setViewUserId] = useState<string | null>(null);

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

    if (result.error) alert(result.error.message);
  }

  async function logout() {
    await supabase.auth.signOut();
    setPage("home");
    setSelectedBook(null);
    setViewUserId(null);
  }

  if (loading) return <div>読み込み中...</div>;

  if (!session) {
    return (
      <div style={{ padding: 24 }}>
        <h1>みんなの図書館</h1>

        <button onClick={() => setMode("login")}>ログイン</button>
        <button onClick={() => setMode("signup")}>新規登録</button>

        <form onSubmit={submit}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">送信</button>
        </form>
      </div>
    );
  }

  // 📖 本詳細
  if (selectedBook) {
    return (
      <BookDetailPage
        book={selectedBook}
        userId={session.user.id}
        onBack={() => setSelectedBook(null)}
        onUserClick={(id) => setViewUserId(id)}
      />
    );
  }

  // 👤 他人プロフィール
  if (viewUserId) {
    return (
      <ProfilePage
        userId={viewUserId}
        onBack={() => setViewUserId(null)}
        onBookSelect={setSelectedBook}
      />
    );
  }

  return (
    <div>
      <button onClick={() => setPage("profile")}>自分のプロフィール</button>
      <button onClick={logout}>ログアウト</button>

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
    </div>
  );
}