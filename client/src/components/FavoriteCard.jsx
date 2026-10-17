// 状態を持つ道具(useState)を読み込む
import { useState } from 'react'
// このカード専用のCSSを読み込む
import './FavoriteCard.css'

// 投稿日時(UTC)を、日本時間の「月/日 時:分」の文字列に変える(小さいカードなので、年は省く)
function formatPostedAt(postedAt) {
  const date = new Date(postedAt)
  return date.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
}

// お気に入りのスライドに並べる、縮小したカードの部品
// 一覧のカード(PostCard)から、@ID を省き、本文は決めた行数まで、画像は1枚目だけにしたもの
// post:投稿1件ぶんのデータ / onToggleFavorite:お気に入りのボタンを押したときに呼ぶ関数(成功なら true、失敗なら false が返る)
function FavoriteCard({ post, onToggleFavorite }) {
  // お気に入りの変更を送っている最中か
  const [isSaving, setIsSaving] = useState(false)
  // お気に入りの変更に失敗したか
  const [isFavoriteError, setIsFavoriteError] = useState(false)

  // 1枚目の画像(画像がない投稿なら undefined)
  const firstMedia = post.media?.[0]

  // お気に入りのボタンが押されたとき(一覧のカードと同じ流れ)
  async function handleFavoriteClick() {
    setIsSaving(true)
    setIsFavoriteError(false)

    // 外すよう頼み、結果を待つ。成功すると、スライドからこのカードが消える
    const isSucceeded = await onToggleFavorite(post.id, !post.is_favorite)

    setIsFavoriteError(!isSucceeded)
    setIsSaving(false)
  }

  return (
    // 画像があるかで、本文を出す行数を変えるため、クラスを付け分ける
    <article className={firstMedia ? 'favorite-card favorite-card-with-media' : 'favorite-card'}>
      {/* 上段:小さいアイコンと、投稿者名・投稿日時 */}
      <header className="favorite-card-header">
        {post.author_icon_url ? (
          <img className="favorite-card-icon" src={post.author_icon_url} alt="" />
        ) : (
          <div className="favorite-card-icon favorite-card-icon-empty" aria-hidden="true" />
        )}

        <div className="favorite-card-author">
          <span className="favorite-card-name">{post.author_name}</span>
          <time className="favorite-card-date" dateTime={post.posted_at}>
            {formatPostedAt(post.posted_at)}
          </time>
        </div>
      </header>

      {/* 本文(決めた行数をこえた分は「…」で省く) */}
      <p className="favorite-card-text">{post.text}</p>

      {/* 画像は1枚目だけ(なければ何も表示しない) */}
      {firstMedia && (
        <img
          className="favorite-card-image"
          src={firstMedia.url}
          alt="投稿の画像 1枚目"
          loading="lazy"
        />
      )}

      {/* 下段:左にお気に入りのボタン、右に元の投稿を開くリンク */}
      <footer className="favorite-card-footer">
        <div className="favorite-card-favorite-area">
          <button
            type="button"
            className={
              post.is_favorite
                ? 'favorite-card-favorite favorite-card-favorite-on'
                : 'favorite-card-favorite'
            }
            onClick={handleFavoriteClick}
            disabled={isSaving}
            aria-label="お気に入り"
            aria-pressed={post.is_favorite}
          >
            {post.is_favorite ? '★' : '☆'}
          </button>

          {/* 失敗の知らせ(カードが狭いので、一覧のカードより短い文言にする) */}
          {isFavoriteError && (
            <span className="favorite-card-favorite-error" role="alert">
              失敗しました
            </span>
          )}
        </div>

        <a
          className="favorite-card-link"
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
export default FavoriteCard
