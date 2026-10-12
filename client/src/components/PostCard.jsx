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

// 投稿1件をカードとして表示する部品(post に投稿1件ぶんのデータを受け取る)
function PostCard({ post }) {
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

      {/* 下段:元の投稿を新しいタブで開くリンク */}
      <footer className="post-card-footer">
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
