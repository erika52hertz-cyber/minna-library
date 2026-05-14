import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import BookDetailPage from "./pages/BookDetailPage";
import FollowingFeedPage from "./pages/FollowingFeedPage";

type Book = {
  id: string;
  title: string;
  author_name: string;
};

export default function App() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [page, setPage] = useState<"home" | "feed" | "profile">("home");
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

    if (result.error) {
      alert(result.error.message);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setPage("home");
    setSelectedBook(null);
    setViewUserId(null);
  }

  function goHome() {
    setPage("home");
    setSelectedBook(null);
    setViewUserId(null);
  }

  function goFeed() {
    setPage("feed");
    setSelectedBook(null);
    setViewUserId(null);
  }

  function goProfile() {
    setPage("profile");
    setSelectedBook(null);
    setViewUserId(null);
  }

  if (loading) return <div style={{ padding: 24 }}>読み込み中...</div>;

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

  let content = null;

  if (selectedBook) {
    content = (
      <BookDetailPage
        book={selectedBook}
        userId={session.user.id}
        onBack={() => setSelectedBook(null)}
        onUserClick={(id) => {
          setSelectedBook(null);
          setViewUserId(id);
        }}
      />
    );
  } else if (viewUserId) {
    content = (
      <ProfilePage
        userId={viewUserId}
        currentUserId={session.user.id}
        onBack={() => setViewUserId(null)}
        onBookSelect={setSelectedBook}
      />
    );
  } else if (page === "feed") {
    content = (
      <FollowingFeedPage
        currentUserId={session.user.id}
        onBack={goHome}
        onBookSelect={setSelectedBook}
        onUserSelect={setViewUserId}
      />
    );
  } else if (page === "profile") {
    content = (
      <ProfilePage
        userId={session.user.id}
        currentUserId={session.user.id}
        onBack={goHome}
        onBookSelect={setSelectedBook}
      />
    );
  } else {
    content = (
      <HomePage
        userId={session.user.id}
        selectedBook={null}
        onBookSelect={setSelectedBook}
        onBack={() => setSelectedBook(null)}
        onUserClick={(id) => {
          setSelectedBook(null);
          setViewUserId(id);
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 76 }}>
      {content}

      <nav
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          height: 64,
          background: "white",
          borderTop: "1px solid #ddd",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          zIndex: 50,
        }}
      >
        <NavButton active={page === "home" && !selectedBook && !viewUserId} onClick={goHome}>
          ホーム
        </NavButton>
        <NavButton active={page === "feed" && !selectedBook && !viewUserId} onClick={goFeed}>
          フォロー中
        </NavButton>
        <NavButton active={page === "profile" && !selectedBook && !viewUserId} onClick={goProfile}>
          プロフィール
        </NavButton>
        <NavButton active={false} onClick={logout}>
          ログアウト
        </NavButton>
      </nav>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: active ? "#fef3c7" : "white",
        color: active ? "#92400e" : "#444",
        fontWeight: active ? "bold" : "normal",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}