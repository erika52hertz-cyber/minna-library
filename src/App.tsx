import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import HomePage from "./pages/HomePage";

export default function App() {
  const [mode, setMode] = useState<"login" | "signup">("login");
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      alert(result.error.message);
    } else if (mode === "signup") {
      alert("登録確認メールを確認してください");
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  if (!session) {
    return (
      <div style={{ padding: 24, maxWidth: 420, margin: "80px auto", fontFamily: "sans-serif" }}>
        <h1>みんなの図書館</h1>
        <p style={{ color: "#666" }}>
          {mode === "login" ? "ログインしてください" : "新規登録してください"}
        </p>

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