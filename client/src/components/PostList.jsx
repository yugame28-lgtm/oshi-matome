// カード1枚の部品を読み込む
import PostCard from './PostCard.jsx'
// この一覧専用のCSSを読み込む
import './PostList.css'

// 投稿の一覧と、読み込みの状態に応じた表示を行う部品
// posts:投稿の配列 / isLoading:最初の20件を読み込み中か / isError:読み込みに失敗したか
// hasMore:続きがあるか / isLoadingMore:「もっと見る」で読み込み中か / onLoadMore:「もっと見る」を押したときに呼ぶ関数
function PostList({ posts, isLoading, isError, hasMore, isLoadingMore, onLoadMore }) {
  // 最初の20件を読み込み中:案内だけを表示する
  if (isLoading) {
    return <p className="post-list-message">読み込み中</p>
  }

  // 投稿が1件もないとき:失敗なら失敗の案内、そうでなければ0件の案内を表示する
  if (posts.length === 0) {
    return isError ? (
      <p className="post-list-message post-list-error">読み込みに失敗しました</p>
    ) : (
      <p className="post-list-message">まだ投稿がありません</p>
    )
  }

  return (
    <div className="post-list-area">
      <ul className="post-list">
        {/* 受け取った順のまま、投稿1件につきカードを1枚作る */}
        {posts.map((post) => (
          // key は、React が各カードを見分けるための目印(投稿の id を使う)
          <li key={post.id}>
            <PostCard post={post} />
          </li>
        ))}
      </ul>

      {/* 「もっと見る」で失敗したとき:表示済みのカードは残したまま、案内を出す */}
      {isError && (
        <p className="post-list-message post-list-error">読み込みに失敗しました</p>
      )}

      {/* 続きがあるときだけ「もっと見る」を出す。読み込み中は押せないようにする */}
      {hasMore && (
        <button
          type="button"
          className="post-list-more"
          onClick={onLoadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? '読み込み中' : 'もっと見る'}
        </button>
      )}
    </div>
  )
}

// ほかのファイルから読み込めるようにする
export default PostList
