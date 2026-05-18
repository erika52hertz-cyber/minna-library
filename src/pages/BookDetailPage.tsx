import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Book = {
  id: string;
  title: string;
  author_name: string;
  genre?: string | null;
  cover_url?: string | null;
  page_count?: number | null;
  published_year?: number | null;
  description?: string | null;
  affiliate_url?: string | null;
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
  const [bookDetail, setBookDetail] = useState<Book>(book);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("new");

  const [status, setStatus] = useState("");
  const [finishedDate, setFinishedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [recordReviewBody, setRecordReviewBody] = useState("");
  const [recordReviewRating, setRecordReviewRating] = useState(5);

  const [isBusinessCardBook, setIsBusinessCardBook] = useState(false);
  const [businessCount, setBusinessCount] = useState(0);

  useEffect(() => {
    loadBookDetail();
    loadReviews();
    loadStatus();
    loadBusinessCardState();
  }, [book.id]);

  async function loadBookDetail() {
    const { data } = await supabase
      .from("books")
      .select(
        "id,title,author_name,genre,cover_url,page_count,published_year,description,affiliate_url"
      )
      .eq("id", book.id)
      .maybeSingle();

    if (data) setBookDetail(data as Book);
  }

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

    if (error) alert(error.message);
  }

  async function addReadingRecord(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.from("reading_records").insert({
      user_id: userId,
      book_id: book.id,
      finished_date: finishedDate,
    });

    if (error) {
      alert(error.message);
      return;
    }

    await saveStatus("finished");

    if (recordReviewBody.trim()) {
      const { error: reviewError } = await supabase.from("reviews").insert({
        book_id: book.id,
        user_id: userId,
        rating: recordReviewRating,
        body: recordReviewBody.trim(),
      });

      if (reviewError) {
        alert(reviewError.message);
        return;
      }

      setRecordReviewBody("");
      setRecordReviewRating(5);
      loadReviews();
    }

    alert("読了記録を追加しました");
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

  const fallbackPurchaseUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(
    `${bookDetail.title} ${bookDetail.author_name}`
  )}`;

  const purchaseUrl = bookDetail.affiliate_url || fallbackPurchaseUrl;

  return (
    <main className="page">
      <button className="secondary" onClick={onBack}>
        ← 戻る
      </button>

      <section className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          {bookDetail.cover_url ? (
            <img
              src={bookDetail.cover_url}
              alt={bookDetail.title}
              style={{
                width: 96,
                height: 136,
                objectFit: "cover",
                borderRadius: 12,
                border: "1px solid #e7e5e4",
              }}
            />
          ) : (
            <div
              style={{
                width: 96,
                height: 136,
                borderRadius: 12,
                background: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#92400e",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              No Image
            </div>
          )}

          <div style={{ flex: 1 }}>
            <h1>{bookDetail.title}</h1>
            <p className="muted">{bookDetail.author_name}</p>

            <div style={{ display: "grid", gap: 4, marginTop: 12 }}>
              {bookDetail.published_year && (
                <div>刊行年：{bookDetail.published_year}年</div>
              )}
              {bookDetail.page_count && (
                <div>ページ数：{bookDetail.page_count}ページ</div>
              )}
              {bookDetail.genre && <div>ジャンル：{bookDetail.genre}</div>}
            </div>
          </div>
        </div>

        {bookDetail.description && (
          <p style={{ marginTop: 16, lineHeight: 1.7 }}>
            {bookDetail.description}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
          <a
            href={purchaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="primary"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            この本を読む
          </a>

          <button
            onClick={toggleBusinessCardBook}
            className={isBusinessCardBook ? "secondary" : "primary"}
          >
            {isBusinessCardBook
              ? "名刺がわりの10冊から外す"
              : `名刺がわりの10冊に追加（${businessCount}/10）`}
          </button>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>読書ステータス</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => saveStatus(opt.value)}
              className={`tag ${status === opt.value ? "active" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>読了記録を追加</h2>

        <form onSubmit={addReadingRecord} style={{ display: "grid", gap: 12 }}>
          <label>
            読了日
            <input
              className="input"
              type="date"
              value={finishedDate}
              onChange={(e) => setFinishedDate(e.target.value)}
            />
          </label>

          <label>
            任意レビュー
            <select
              value={recordReviewRating}
              onChange={(e) => setRecordReviewRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}★
                </option>
              ))}
            </select>

            <textarea
              value={recordReviewBody}
              onChange={(e) => setRecordReviewBody(e.target.value)}
              placeholder="読了と同時に感想を書く場合はこちら"
              style={{ minHeight: 80, marginTop: 8 }}
            />
          </label>

          <button className="primary" type="submit">
            読了として記録する
          </button>
        </form>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>レビュー投稿</h2>

        <form onSubmit={submitReview} style={{ display: "grid", gap: 12 }}>
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
            style={{ minHeight: 90 }}
          />

          <button className="primary" type="submit">
            投稿
          </button>
        </form>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>レビュー一覧</h2>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="secondary" onClick={() => setSortMode("new")}>
            新着順
          </button>
          <button className="secondary" onClick={() => setSortMode("likes")}>
            いいね順
          </button>
        </div>

        {sortedReviews.map((review) => {
          const name = review.profile?.username || review.profile?.email || "ユーザー";

          return (
            <div key={review.id} className="card" style={{ marginTop: 12 }}>
              <button
                onClick={() => onUserClick(review.user_id)}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  color: "#2563eb",
                  textDecoration: "underline",
                }}
              >
                {name}
              </button>

              <div style={{ marginTop: 8 }}>{"★".repeat(review.rating)}</div>
              <p>{review.body}</p>

              <button className="secondary" onClick={() => toggleLike(review)}>
                {review.liked_by_me ? "♥ いいね済み" : "♡ いいね"} {review.like_count}
              </button>
            </div>
          );
        })}
      </section>
    </main>
  );
}