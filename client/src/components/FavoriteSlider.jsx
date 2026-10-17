// 縮小したカードの部品を読み込む
import FavoriteCard from './FavoriteCard.jsx'
// この部品専用のCSSを読み込む
import './FavoriteSlider.css'

// お気に入りにした投稿を、横にスライドして見る部品
// posts:お気に入りの投稿の配列(投稿日時の新しい順) / onToggleFavorite:カードのお気に入りのボタンを押したときに呼ぶ関数
function FavoriteSlider({ posts, onToggleFavorite }) {
  // 0件のときは、場所ごと表示しない
  if (posts.length === 0) {
    return null
  }

  return (
    // aria-label は、読み上げソフトに、このまとまりの名前を伝えるための目印
    <section className="favorite-slider" aria-label="お気に入り">
      {/* 見出し(小さく控えめに出す) */}
      <h2 className="favorite-slider-title">お気に入り</h2>

      {/* カードを横に並べ、はみ出した分は横にスライドして見る */}
      <ul className="favorite-slider-list">
        {posts.map((post) => (
          // key は、React が各カードを見分けるための目印(投稿の id を使う)
          <li key={post.id} className="favorite-slider-item">
            <FavoriteCard post={post} onToggleFavorite={onToggleFavorite} />
          </li>
        ))}
      </ul>
    </section>
  )
}

// ほかのファイルから読み込めるようにする
export default FavoriteSlider
