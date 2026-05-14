import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Book = {
  id: string;
  title: string;
  author_name: string;
};

type SortMode = "new" | "likes";

type Review = {
  id: string;
  user_id: string;
  rating: number;
  body: string;
  created_at: string;
  like_count: number;
  liked_by_me: boolean;
  profile: {
    username: string | null;
    email: string | null;
  } | null;
};

type Props = {
  book: Book;
  userId: string;
  onBack: () => void;
  onUserClick: (userId: string) => void;
};

const STATUS_OPTIONS = [
  { value: "finished", label: "読破" },
  { value: "reading", label: "読書中" },
  { value: "want", label: "積読" },
  { value: "owned", label: "購入予定" },
];

export default function BookDetailPage({
  book,
  userId,
  onBack,
  onUserClick,
}: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("new");
  const [status, setStatus] = useState<string>("");
  const [isBusinessCardBook, setIsBusinessCardBook] = useState(false);
  const [businessCount, setBusinessCount] = useState(0);

  useEffect(() => {
    loadReviews();
    loadStatus();
    loadBusinessCardState();
  }, [book.id]);

  async function loadStatus() {
    const { data } = await supabase
      .from("user_books")
      .select("status")
      .eq("user_id", userId)
      .eq("book_id", book.id)
      .maybeSingle();

    setStatus(data?.status ?? "");
  }

  async function saveStatus(value: string) {
    setStatus(value);

    const { error } = await supabase.from("user_books").upsert({
      user_id: userId,
      book_id: book.id,
      status: value,
    });

    if (error) {
      alert(error.message);
    }
  }

  async function loadBusinessCardState() {
    const { count } = await supabase
      .from("business_card_books")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    setBusinessCount(count ?? 0);

    const { data } = await supabase
      .from("business_card_books")
      .select("id")
      .eq("user_id", userId)
      .eq("book_id", book.id)
      .maybeSingle();

    setIsBusinessCardBook(!!data);
  }

  async function toggleBusinessCardBook() {
    if (isBusinessCardBook) {
      const { error } = await supabase
        .from("business_card_books")
        .delete()
        .eq("user_id", userId)
        .eq("book_id", book.id);

      if (error) {
        alert(error.message);
        return;
      }

      await loadBusinessCardState();
      return;
    }

    if (businessCount >= 10) {
      alert("名刺がわりの10冊は最大10冊までです");
      return;
    }

    const { error } = await supabase.from("business_card_books").insert({
      user_id: userId,
      book_id: book.id,
      position: businessCount + 1,
    });

    if (error) {
      alert(error.message);
      return;
    }

    await loadBusinessCardState();
  }

  async function loadReviews() {
    const { data: reviewData } = await supabase
      .from("reviews")
      .select("id,user_id,rating,body,created_at")
      .eq("book_id", book.id)
      .order("created_at", { ascending: false });

    const reviewsWithDetails = await Promise.all(
      (reviewData ?? []).map(async (review) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username,email")
          .eq("id", review.user_id)
          .maybeSingle();

        const { count } = await supabase
          .from("review_likes")
          .select("*", { count: "exact", head: true })
          .eq("review_id", review.id);

        const { data: myLike } = await supabase
          .from("review_likes")
          .select("id")
          .eq("review_id", review.id)
          .eq("user_id", userId)
          .maybeSingle();

        return {
          ...review,
          profile,
          like_count: count ?? 0,
          liked_by_me: !!myLike,
        };
      })
    );

    setReviews(reviewsWithDetails);
  }

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortMode === "likes") return b.like_count - a.like_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();

    if (!body.trim()) {
      alert("感想を入力してください");
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      book_id: book.id,
      user_id: userId,
      rating,
      body,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setBody("");
    setRating(5);
    loadReviews();
  }

  async function toggleLike(review: Review) {
    if (review.liked_by_me) {
      await supabase
        .from("review_likes")
        .delete()
        .eq("review_id", review.id)
        .eq("user_id", userId);
    } else {
      await supabase.from("review_likes").insert({
        review_id: review.id,
        user_id: userId,
      });
    }

    loadReviews();
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <button onClick={onBack}>← 戻る</button>

      <h1>{book.title}</h1>
      <p>{book.author_name}</p>

      <section style={{ marginTop: 16 }}>
        <button
          onClick={toggleBusinessCardBook}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid #ddd",
            background: isBusinessCardBook ? "#fef3c7" : "white",
            color: isBusinessCardBook ? "#92400e" : "#333",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {isBusinessCardBook
            ? "名刺がわりの10冊から外す"
            : `名刺がわりの10冊に追加（${businessCount}/10）`}
        </button>
      </section>

      <section style={{ marginTop: 16 }}>
        <h3>読書ステータス</h3>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => saveStatus(opt.value)}
            style={{
              marginRight: 8,
              marginTop: 6,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid #ddd",
              background: status === opt.value ? "#92400e" : "white",
              color: status === opt.value ? "white" : "#333",
              cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        ))}
      </section>

      <form onSubmit={submitReview} style={{ marginTop: 20, display: "grid", gap: 8 }}>
        <h3>レビュー投稿</h3>

        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}★
            </option>
          ))}
        </select>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="感想を書く"
          style={{ minHeight: 90, padding: 10 }}
        />

        <button type="submit">投稿</button>
      </form>

      <section style={{ marginTop: 24 }}>
        <h3>レビュー一覧</h3>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setSortMode("new")}>新着順</button>
          <button onClick={() => setSortMode("likes")}>いいね順</button>
        </div>

        {sortedReviews.map((review) => {
          const name = review.profile?.username || review.profile?.email || "ユーザー";

          return (
            <div key={review.id} style={{ border: "1px solid #ddd", marginTop: 10, padding: 12 }}>
              <button onClick={() => onUserClick(review.user_id)}>{name}</button>

              <div>{"★".repeat(review.rating)}</div>
              <p>{review.body}</p>

              <button onClick={() => toggleLike(review)}>
                {review.liked_by_me ? "♥ いいね済み" : "♡ いいね"} {review.like_count}
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}