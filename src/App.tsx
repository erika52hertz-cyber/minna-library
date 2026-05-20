import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import BookDetailPage from "./pages/BookDetailPage";
import FollowingFeedPage from "./pages/FollowingFeedPage";
import RankingPage from "./pages/RankingPage";
import PremiumPage from "./pages/PremiumPage";

type Book = {
  id: string;
  title: string;
  author_name: string;
};

export default function App() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [page, setPage] = useState<"home" | "feed" | "ranking" | "profile" | "premium">("home");

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [viewUserId, setViewUserId] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<"free" | "premium">("free");

  const isPremium = plan === "premium";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);

      if (data.session?.user?.id) {
        loadMyPlan(data.session.user.id);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session?.user?.id) {
        loadMyPlan(session.user.id);
      } else {
        setPlan("free");
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function loadMyPlan(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();

    setPlan(data?.plan === "premium" ? "premium" : "free");
  }

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
    setPlan("free");
  }

  function resetViews() {
    setSelectedBook(null);
    setViewUserId(null);
  }

  if (loading) return <div className="page">読み込み中...</div>;

  if (!session) {
    return (
      <main className="page">
        <section className="card">
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>みんなの図書館</h1>
          <p className="muted" style={{ marginBottom: 20 }}>
            本の感想を投稿し、好きな本・好きな読書家とつながる読書SNSです。
          </p>

          <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
            <div>本を検索してレビューできます</div>
            <div>レビューにいいねできます</div>
            <div>名刺がわりの10冊をプロフィールに表示できます</div>
            <div>人気レビューランキングを確認できます</div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button className={mode === "login" ? "primary" : "secondary"} onClick={() => setMode("login")}>
              ログイン
            </button>
            <button className={mode === "signup" ? "primary" : "secondary"} onClick={() => setMode("signup")}>
              新規登録
            </button>
          </div>

          <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            <input className="input" type="email" placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" type="password" placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="primary" type="submit">
              {mode === "login" ? "ログインする" : "登録する"}
            </button>
          </form>
        </section>
      </main>
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
        isPremium={isPremium}
        onBack={() => setViewUserId(null)}
        onBookSelect={setSelectedBook}
        onLogout={logout}
      />
    );
  } else if (page === "feed") {
    content = (
      <FollowingFeedPage
        currentUserId={session.user.id}
        onBack={() => setPage("home")}
        onBookSelect={setSelectedBook}
        onUserSelect={setViewUserId}
      />
    );
  } else if (page === "ranking") {
    content = <RankingPage onBack={() => setPage("home")} onBookSelect={setSelectedBook} onUserSelect={setViewUserId} />;
  } else if (page === "premium") {
    content = <PremiumPage onBack={() => setPage("profile")} />;
  } else if (page === "profile") {
    content = (
      <ProfilePage
        userId={session.user.id}
        currentUserId={session.user.id}
        isPremium={isPremium}
        onBack={() => setPage("home")}
        onBookSelect={setSelectedBook}
        onLogout={logout}
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
          gridTemplateColumns: "repeat(5, 1fr)",
          zIndex: 50,
        }}
      >
        <NavButton active={page === "home" && !selectedBook && !viewUserId} onClick={() => { resetViews(); setPage("home"); }}>
          ホーム
        </NavButton>
        <NavButton active={page === "feed" && !selectedBook && !viewUserId} onClick={() => { resetViews(); setPage("feed"); }}>
          フォロー
        </NavButton>
        <NavButton active={page === "ranking" && !selectedBook && !viewUserId} onClick={() => { resetViews(); setPage("ranking"); }}>
          人気
        </NavButton>
        <NavButton active={page === "premium" && !selectedBook && !viewUserId} onClick={() => { resetViews(); setPage("premium"); }}>
          {isPremium ? "Premium" : "プレミアム"}
        </NavButton>
        <NavButton active={page === "profile" && !selectedBook && !viewUserId} onClick={() => { resetViews(); setPage("profile"); }}>
          マイページ
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
      }}
    >
      {children}
    </button>
  );
}