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

const EMOTION_TAGS = ["スカッと", "ハラハラ", "不安", "不気味", "人間関係", "余韻が強い", "優しい", "再生", "切ない", "孤独", "寂しい", "希望", "心が温まる", "怖い", "悲しい", "愛", "救い", "泣ける", "爽快", "狂気", "癒される", "絶望", "緊張感", "考えさせられる", "苦しい", "虚無", "重い", "静か"];

const THEME_TAGS = ["SF", "SNS", "サスペンス", "トラウマ", "ファンタジー", "ホラー", "ミステリー", "仕事", "医療", "友情", "学校", "宗教", "家族", "復讐", "恋愛", "成長", "戦争", "政治", "格差", "歴史", "犯罪", "生と死", "社会問題", "結婚", "芸術", "裏切り", "親子", "貧困", "離婚", "青春", "音楽"];

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

    if (selectedGenre) {
      request = request.eq("genre", selectedGenre);
    }

    if (selectedEmotion) {
      request = request.contains("emotion_tags", [selectedEmotion]);
    }

    if (selectedTheme) {
      request = request.contains("theme_tags", [selectedTheme]);
    }

    if (selectedExperience) {
      request = request.contains("experience_tags", [selectedExperience]);
    }

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
    <div style={{ padding: 24, maxWidth: 760, margin: "0 auto" }}>
      <h1>検索</h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="タイトル・著者名で検索"
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 16,
          border: "1px solid #ddd",
          boxSizing: "border-box",
        }}
      />

      <button onClick={clearFilters} style={{ marginTop: 12 }}>
        クリア
      </button>

      <TagSection
        title="ジャンル"
        tags={GENRES}
        selected={selectedGenre}
        onSelect={setSelectedGenre}
      />

      <TagSection
        title="感情タグ"
        tags={EMOTION_TAGS}
        selected={selectedEmotion}
        onSelect={setSelectedEmotion}
      />

      <TagSection
        title="テーマタグ"
        tags={THEME_TAGS}
        selected={selectedTheme}
        onSelect={setSelectedTheme}
      />

      <TagSection
        title="体験タグ"
        tags={EXPERIENCE_TAGS}
        selected={selectedExperience}
        onSelect={setSelectedExperience}
      />

      <h2 style={{ marginTop: 24 }}>検索結果：{books.length}件</h2>

      {books.length === 0 ? (
        <p style={{ color: "#777" }}>該当する本が見つかりませんでした。</p>
      ) : (
        books.map((book) => (
          <div
            key={book.id}
            onClick={() => onBookSelect(book)}
            style={{
              padding: 14,
              border: "1px solid #ddd",
              borderRadius: 12,
              marginTop: 10,
              cursor: "pointer",
              background: "white",
            }}
          >
            <strong>{book.title}</strong>
            <div style={{ color: "#666" }}>{book.author_name}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#92400e" }}>
              {book.genre}
            </div>
          </div>
        ))
      )}
    </div>
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
    <section style={{ marginTop: 20 }}>
      <h3>{title}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tags.map((tag) => {
          const active = selected === tag;

          return (
            <button
              key={tag}
              onClick={() => onSelect(active ? null : tag)}
              style={{
                padding: "7px 12px",
                borderRadius: 999,
                border: "1px solid #ddd",
                background: active ? "#92400e" : "white",
                color: active ? "white" : "#444",
                cursor: "pointer",
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </section>
  );
}