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
  // 🔥 デバッグ用（Supabase URL & KEY確認）
  console.log("SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log(
    "ANON KEY HEAD:",
    import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 20)
  );

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
    return <div style={{ padding: 24 }}>読み込み中...</div>;
  }

  // 🔐 未ログイン
  if (!session) {
    return (
      <div style={{ padding: 24 }}>
        <h1>みんなの図書館</h1>

        <div style={{ marginBottom: 12 }}>
          <button onClick={() => setMode("login")}>ログイン</button>
          <button onClick={() => setMode("signup")}>新規登録</button>
        </div>

        <form onSubmit={submit}>
          <input
            type="email"
            placeholder="メール"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />
          <button type="submit">
            {mode === "login" ? "ログイン" : "登録"}
          </button>
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
      />
    );
  }

  // 🏠 メイン
  return (
    <div>
      <div style={{ position: "fixed", right: 16, top: 16 }}>
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
    </div>
  );
}