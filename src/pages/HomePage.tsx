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

  useEffect(() => {
    searchBooks();
  }, [query, selectedGenre, selectedEmotion, selectedTheme, selectedExperience]);

  async function searchBooks() {
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
      return;
    }

    setBooks((data ?? []) as Book[]);
  }

  function clearFilters() {
    setQuery("");
    setSelectedGenre(null);
    setSelectedEmotion(null);
    setSelectedTheme(null);
    setSelectedExperience(null);
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
    <main className="page bottom-space">
      <header className="card" style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 30, marginBottom: 6 }}>みんなの図書館</h1>
        <p className="muted" style={{ marginBottom: 18 }}>
          ぴったりの一冊と、本音のレビューに出会う場所
        </p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="タイトル・著者名で検索"
        />

        <button className="secondary-button" onClick={clearFilters} style={{ marginTop: 12 }}>
          条件をクリア
        </button>
      </header>

      <TagSection title="ジャンル" tags={GENRES} selected={selectedGenre} onSelect={setSelectedGenre} />
      <TagSection title="感情タグ" tags={EMOTION_TAGS} selected={selectedEmotion} onSelect={setSelectedEmotion} />
      <TagSection title="テーマタグ" tags={THEME_TAGS} selected={selectedTheme} onSelect={setSelectedTheme} />
      <TagSection title="体験タグ" tags={EXPERIENCE_TAGS} selected={selectedExperience} onSelect={setSelectedExperience} />

      <section style={{ marginTop: 24 }}>
        <h2>検索結果：{books.length}件</h2>

        {books.length === 0 ? (
          <div className="card muted">該当する本が見つかりませんでした。</div>
        ) : (
          books.map((book) => (
            <button
              key={book.id}
              onClick={() => onBookSelect(book)}
              className="book-card"
              style={{ marginTop: 12 }}
            >
              <strong style={{ fontSize: 17 }}>{book.title}</strong>
              <div className="muted" style={{ marginTop: 4 }}>{book.author_name}</div>
              {book.genre && (
                <div style={{ marginTop: 8, color: "#92400e", fontSize: 13, fontWeight: 700 }}>
                  {book.genre}
                </div>
              )}
            </button>
          ))
        )}
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
    <section className="card" style={{ marginTop: 14 }}>
      <h3 style={{ marginBottom: 12 }}>{title}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => onSelect(selected === tag ? null : tag)}
            className={`tag-button ${selected === tag ? "active" : ""}`}
          >
            {tag}
          </button>
        ))}
      </div>
    </section>
  );
}