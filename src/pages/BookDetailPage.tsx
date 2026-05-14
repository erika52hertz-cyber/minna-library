type Book = {
  id: string;
  title: string;
  author_name: string;
};

type Props = {
  book: Book;
  onBack: () => void;
};

export default function BookDetailPage({ book, onBack }: Props) {
  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "sans-serif" }}>
      <button onClick={onBack} style={{ marginBottom: 24 }}>
        ← 戻る
      </button>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 16,
          padding: 24,
          background: "white",
        }}
      >
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>{book.title}</h1>
        <p style={{ color: "#666", fontSize: 16 }}>{book.author_name}</p>
      </div>
    </div>
  );
}