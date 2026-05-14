import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import HomePage from "./pages/HomePage";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  if (!session) {
    return (
      <div style={{ padding: 24, maxWidth: 420, margin: "80px auto", fontFamily: "sans-serif" }}>
        <h1>みんなの図書館</h1>
        <p style={{ color: "#666" }}>ログインしてください</p>

        <form onSubmit={login} style={{ display: "grid", gap: 12 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
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
            ログイン
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={logout}
        style={{
          position: "fixed",
          right: 16,
          top: 16,
          zIndex: 10,
          padding: "8px 12px",
          borderRadius: 999,
          border: "1px solid #ddd",
          background: "white",
        }}
      >
        ログアウト
      </button>
      <HomePage />
    </>
  );
}