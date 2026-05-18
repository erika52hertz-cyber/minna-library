import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import BookDetailPage from "./BookDetailPage";

type Book = {
  id: string;
  title: string;
  author_name: string;
  genre: string | null;
  emotion_tags: string[] | null;
  theme_tags: string[] | null;
  experience_tags: string[] | null;
};

const GENRES = ["SF", "コメディ", "サスペンス", "ノワール", "ヒューマンドラマ", "ファンタジー", "ホラー", "ミステリー", "冒険", "恋愛", "推理", "歴史・時代小説", "社会派", "純文学", "青春"];
const EMOTION_TAGS = ["スカッと", "ハラハラ", "不安", "不気味", "余韻が強い", "優しい", "切ない", "孤独", "希望", "怖い", "悲しい", "泣ける", "爽快", "狂気", "癒される", "緊張感", "考えさせられる", "重い", "静か"];
const THEME_TAGS = ["SF", "SNS", "サスペンス", "ファンタジー", "ホラー", "ミステリー", "仕事", "友情", "学校", "家族", "復讐", "恋愛", "成長", "戦争", "政治", "歴史", "犯罪", "生と死", "社会問題", "青春", "音楽"];
const EXPERIENCE_TAGS = ["どんでん返し", "伏線回収", "会話中心", "展開が早い", "後味が悪い", "後味が良い"];

export default function HomePage({
  userId,
  selectedBook,
  onBookSelect,
  onBack,
  onUserClick,
}: {
  userId: string;
  selectedBook: Book | null;
  onBookSelect: (book: Book) => void;
  onBack: () => void;
  onUserClick: (userId: string) => void;
}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [loading, setLoading] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newGenre, setNewGenre] = useState("ミステリー");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    handleSearch(false);
  }, []);

  async function handleSearch(closeFilters = true) {
    setLoading(true);

    let request = supabase
      .from("books")
      .select("id,title,author_name,genre,emotion_tags,theme_tags,experience_tags")
      .limit(50);

    if (query.trim()) {
      const q = query.trim();
      request = request.or(`title.ilike.%${q}%,author_name.ilike.%${q}%`);
    }

    if (selectedGenre) request = request.eq("genre", selectedGenre);
    if (selectedEmotion) request = request.contains("emotion_tags", [selectedEmotion]);
    if (selectedTheme) request = request.contains("theme_tags", [selectedTheme]);
    if (selectedExperience) request = request.contains("experience_tags", [selectedExperience]);

    const { data, error } = await request;

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setBooks((data ?? []) as Book[]);
    setLoading(false);

    if (closeFilters) setShowFilters(false);
  }

  function clearFilters() {
    setQuery("");
    setSelectedGenre(null);
    setSelectedEmotion(null);
    setSelectedTheme(null);
    setSelectedExperience(null);
    setShowFilters(true);

    setTimeout(() => {
      handleSearch(false);
    }, 0);
  }

  async function addBook(e: React.FormEvent) {
    e.preventDefault();

    if (!newTitle.trim() || !newAuthor.trim()) {
      alert("タイトルと著者名を入力してください");
      return;
    }

    setAdding(true);

    const { data, error } = await supabase
      .from("books")
      .insert({
        title: newTitle.trim(),
        author_name: newAuthor.trim(),
        genre: newGenre,
        emotion_tags: [],
        theme_tags: [],
        experience_tags: [],
      })
      .select("id,title,author_name,genre,emotion_tags,theme_tags,experience_tags")
      .single();

    setAdding(false);

    if (error) {
      alert(error.message);
      return;
    }

    setShowAddForm(false);
    setNewTitle("");
    setNewAuthor("");
    setBooks((prev) => [data as Book, ...prev]);
    onBookSelect(data as Book);
  }

  if (selectedBook) {
    return (
      <BookDetailPage
        book={selectedBook}
        userId={userId}
        onBack={onBack}
        onUserClick={onUserClick}
      />
    );
  }

  return (
    <main className="page">
      <section className="card">
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>検索</h1>
        <p className="muted">気分・テーマ・読後感から本を探せます。</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: 10,
            marginTop: 18,
            alignItems: "center",
          }}
        >
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タイトル・著者名で検索"
          />

          <button className="primary" onClick={() => handleSearch(true)} style={{ whiteSpace: "nowrap" }}>
            検索
          </button>

          <button className="secondary" onClick={clearFilters} style={{ whiteSpace: "nowrap" }}>
            クリア
          </button>
        </div>

        <button
          className="secondary"
          onClick={() => setShowFilters(!showFilters)}
          style={{ marginTop: 12 }}
        >
          {showFilters ? "条件を閉じる" : "条件を開く"}
        </button>
      </section>

      {showFilters && (
        <>
          <TagSection title="ジャンル" tags={GENRES} selected={selectedGenre} onSelect={setSelectedGenre} />
          <TagSection title="感情タグ" tags={EMOTION_TAGS} selected={selectedEmotion} onSelect={setSelectedEmotion} />
          <TagSection title="テーマタグ" tags={THEME_TAGS} selected={selectedTheme} onSelect={setSelectedTheme} />
          <TagSection title="体験タグ" tags={EXPERIENCE_TAGS} selected={selectedExperience} onSelect={setSelectedExperience} />
        </>
      )}

      <section style={{ marginTop: 24 }}>
        <h2>{loading ? "検索中..." : `検索結果：${books.length}件`}</h2>

        {!loading && books.length === 0 && (
          <div className="card">
            <p className="muted">該当する本が見つかりませんでした。</p>

            <button className="primary" onClick={() => setShowAddForm(true)}>
              本を追加する
            </button>
          </div>
        )}

        {showAddForm && (
          <section className="card" style={{ marginTop: 16 }}>
            <h2>本を追加</h2>

            <form onSubmit={addBook} style={{ display: "grid", gap: 12 }}>
              <input
                className="input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="タイトル"
              />

              <input
                className="input"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="著者名"
              />

              <select
                className="input"
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
              >
                {GENRES.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 8 }}>
                <button className="primary" type="submit" disabled={adding}>
                  {adding ? "追加中..." : "追加する"}
                </button>

                <button
                  className="secondary"
                  type="button"
                  onClick={() => setShowAddForm(false)}
                >
                  キャンセル
                </button>
              </div>
            </form>
          </section>
        )}

        {books.map((book) => (
          <button key={book.id} className="book-card" onClick={() => onBookSelect(book)}>
            <strong style={{ fontSize: 18 }}>{book.title}</strong>
            <div className="muted" style={{ marginTop: 4 }}>{book.author_name}</div>
            {book.genre && (
              <div style={{ marginTop: 8, color: "#b45309", fontWeight: 700 }}>
                {book.genre}
              </div>
            )}
          </button>
        ))}
      </section>
    </main>
  );
}

function TagSection({
  title,
  tags,
  selected,
  onSelect,
}: {
  title: string;
  tags: string[];
  selected: string | null;
  onSelect: (tag: string | null) => void;
}) {
  return (
    <section className="card" style={{ marginTop: 16 }}>
      <h3 style={{ marginBottom: 14 }}>{title}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tags.map((tag) => (
          <button
            key={tag}
            className={`tag ${selected === tag ? "active" : ""}`}
            onClick={() => onSelect(selected === tag ? null : tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </section>
  );
}