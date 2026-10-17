// 状態を持つ道具(useState)を読み込む
import { useState } from 'react'
// このカード専用のCSSを読み込む
import './PostCard.css'
// 画像を枚数に応じて並べる部品を読み込む
import MediaGrid from './MediaGrid.jsx'

// 投稿日時(UTC)を、日本時間の「年/月/日 時:分」の文字列に変える
function formatPostedAt(postedAt) {
  // 文字列を日時として扱える形にする
  const date = new Date(postedAt)

  // 日本時間・2桁そろえ・24時間表記(0時は 00)で文字列にする
  return date.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
}

// 投稿1件をカードとして表示する部品
// post:投稿1件ぶんのデータ / onToggleFavorite:お気に入りのボタンを押したときに呼ぶ関数(成功なら true、失敗なら false が返る)
function PostCard({ post, onToggleFavorite }) {
  // お気に入りの変更を送っている最中か(このカードだけの状態なので、カードの中で持つ)
  const [isSaving, setIsSaving] = useState(false)
  // お気に入りの変更に失敗したか
  const [isFavoriteError, setIsFavoriteError] = useState(false)

  // お気に入りのボタンが押されたとき
  async function handleFavoriteClick() {
    // 送っている最中は押せなくし、前の失敗の知らせが残っていれば消す
    setIsSaving(true)
    setIsFavoriteError(false)

    // 今と逆の状態(付いていれば外す、外れていれば付ける)に変えるよう頼み、結果を待つ
    const isSucceeded = await onToggleFavorite(post.id, !post.is_favorite)

    // 失敗していたら知らせを出し、ボタンを押せるように戻す
    setIsFavoriteError(!isSucceeded)
    setIsSaving(false)
  }

  return (
    <article className="post-card">
      {/* 上段:アイコンと投稿者の情報 */}
      <header className="post-card-header">
        {/* アイコンURLがあれば画像、なければ代わりの丸を表示する */}
        {post.author_icon_url ? (
          <img className="post-card-icon" src={post.author_icon_url} alt="" />
        ) : (
          <div className="post-card-icon post-card-icon-empty" aria-hidden="true" />
        )}

        <div className="post-card-author">
          {/* 投稿者名と @ID(先頭に@を付ける) */}
          <div className="post-card-names">
            <span className="post-card-name">{post.author_name}</span>
            <span className="post-card-username">@{post.author_username}</span>
          </div>

          {/* 投稿日時(画面には日本時間、dateTime には元の値を入れる) */}
          <time className="post-card-date" dateTime={post.posted_at}>
            {formatPostedAt(post.posted_at)}
          </time>
        </div>
      </header>

      {/* 本文(改行はCSSで保持する) */}
      <p className="post-card-text">{post.text}</p>

      {/* 画像(0枚なら何も表示しない)。media がないデータでも動くよう、そのときは0枚として渡す */}
      <MediaGrid media={post.media ?? []} />

      {/* 下段:左にお気に入りのボタン、右に元の投稿を開くリンク */}
      <footer className="post-card-footer">
        <div className="post-card-favorite-area">
          {/* お気に入りのボタン(付いていれば ★、外れていれば ☆) */}
          {/* 記号だけでは読み上げソフトに伝わらないので、aria-label で名前を、aria-pressed で付いているかを伝える */}
          <button
            type="button"
            className={
              post.is_favorite ? 'post-card-favorite post-card-favorite-on' : 'post-card-favorite'
            }
            onClick={handleFavoriteClick}
            disabled={isSaving}
            aria-label="お気に入り"
            aria-pressed={post.is_favorite}
          >
            {post.is_favorite ? '★' : '☆'}
          </button>

          {/* 失敗の知らせ(次にボタンを押すまで、ボタンのとなりに出す) */}
          {isFavoriteError && (
            <span className="post-card-favorite-error" role="alert">
              変更できませんでした
            </span>
          )}
        </div>

        {/* 元の投稿を新しいタブで開くリンク */}
        <a
          className="post-card-link"
          href={post.post_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Xで見る →
        </a>
      </footer>
    </article>
  )
}

// ほかのファイルから読み込めるようにする
export default PostCard
