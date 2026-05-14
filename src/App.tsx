import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [page, setPage] = useState<"home" | "profile">("home");
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
  }

  if (loading) {
    return <div style={{ padding: 40 }}>読み込み中...</div>;
  }

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafaf9", padding: 24, fontFamily: "sans-serif" }}>
        <div style={{ maxWidth: 420, margin: "80px auto", background: "white", padding: 24, borderRadius: 18 }}>
          <h1>みんなの図書館</h1>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => setMode("login")}>ログイン</button>
            <button onClick={() => setMode("signup")}>新規登録</button>
          </div>

          <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
              type="email"
              style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              type="password"
              style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
            />
            <button
              type="submit"
              style={{ padding: 12, borderRadius: 10, border: "none", background: "#92400e", color: "white" }}
            >
              {mode === "login" ? "ログイン" : "新規登録"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ position: "fixed", right: 16, top: 16, zIndex: 20, display: "flex", gap: 8 }}>
        <button onClick={() => setPage("profile")}>プロフィール</button>
        <button onClick={logout}>ログアウト</button>
      </div>

      {page === "home" ? (
        <HomePage userId={session.user.id} />
      ) : (
        <ProfilePage userId={session.user.id} onBack={() => setPage("home")} />
      )}
    </>
  );
}