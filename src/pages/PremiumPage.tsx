export default function PremiumPage({
  onBack,
}: {
  onBack: () => void;
}) {
  return (
    <main className="page">
      <button className="secondary" onClick={onBack}>
        ← 戻る
      </button>

      <section className="card" style={{ marginTop: 16 }}>
        <p className="muted" style={{ fontWeight: 700 }}>
          Premium
        </p>

        <h1 style={{ fontSize: 32, marginBottom: 8 }}>
          読書をもっと楽しく記録する
        </h1>

        <p className="muted">
          月350円で、読書記録・保存・検索をもっと便利に使えます。
        </p>

        <div
          style={{
            marginTop: 20,
            padding: 18,
            borderRadius: 18,
            background: "#fef3c7",
            color: "#78350f",
          }}
        >
          <strong style={{ fontSize: 28 }}>月350円</strong>
          <div>1日あたり約12円で、読書記録をずっと残せます。</div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>プレミアムでできること</h2>

        <div style={{ display: "grid", gap: 14 }}>
          <Feature
            title="過去すべての読書レポート"
            description="無料では今月分のみ。プレミアムでは過去の月・年ごとの記録を振り返れます。"
          />

          <Feature
            title="年間読書レポート"
            description="読んだ冊数、ページ数、ジャンル割合、著者割合を年ごとに確認できます。"
          />

          <Feature
            title="保存リスト"
            description="気になる本、あとで読みたい本を保存して、読みたい本を逃しません。"
          />

          <Feature
            title="検索強化"
            description="複数タグ検索や並び替えで、自分に合う本を探しやすくします。"
          />

          <Feature
            title="おすすめ機能"
            description="読書傾向やタグから、次に読みたい本を見つけやすくします。"
          />

          <Feature
            title="広告なし"
            description="将来的に広告を表示する場合でも、プレミアムでは広告なしで使えます。"
          />
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>無料プランとの違い</h2>

        <PlanRow label="今月の読書記録" free="表示可" premium="表示可" />
        <PlanRow label="過去の月別レポート" free="不可" premium="無制限" />
        <PlanRow label="年間レポート" free="不可" premium="表示可" />
        <PlanRow label="保存リスト" free="制限あり" premium="無制限" />
        <PlanRow label="おすすめ機能" free="不可" premium="利用可" />
        <PlanRow label="広告" free="あり" premium="なし" />
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>読書が続く理由を作る</h2>
        <p className="muted">
          読書記録は、ただのメモではなく、自分の変化を見返すためのものです。
          冊数やページ数、ジャンルの変化が見えると、読むこと自体が楽しくなります。
        </p>

        <button
          className="primary"
          onClick={() => alert("決済機能は次に実装します")}
          style={{ width: "100%", marginTop: 12 }}
        >
          月350円でプレミアムを始める
        </button>
      </section>
    </main>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        padding: 14,
        border: "1px solid #e7e5e4",
        borderRadius: 14,
        background: "white",
      }}
    >
      <strong>{title}</strong>
      <p className="muted" style={{ margin: "6px 0 0" }}>
        {description}
      </p>
    </div>
  );
}

function PlanRow({
  label,
  free,
  premium,
}: {
  label: string;
  free: string;
  premium: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr 1fr",
        gap: 8,
        padding: "10px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <div>{label}</div>
      <div className="muted">{free}</div>
      <strong style={{ color: "#92400e" }}>{premium}</strong>
    </div>
  );
}