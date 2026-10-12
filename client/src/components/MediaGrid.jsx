// この部品専用のCSSを読み込む
import './MediaGrid.css'

// 画像の枚数から、並べ方のクラス名を決める
function getLayoutClass(count) {
  // 1枚:大きく1枚
  if (count === 1) {
    return 'media-grid-one'
  }
  // 2枚:横に2枚
  if (count === 2) {
    return 'media-grid-two'
  }
  // 3〜4枚:2×2のグリッド(3枚のときは右下が空く)
  return 'media-grid-four'
}

// 投稿の画像を、枚数に応じて並べる部品(media に画像の配列を受け取る)
function MediaGrid({ media }) {
  // 画像が0枚なら、何も表示しない(場所も取らない)
  if (media.length === 0) {
    return null
  }

  return (
    // 共通のクラスと、枚数ごとのクラスの2つを付ける
    <div className={`media-grid ${getLayoutClass(media.length)}`}>
      {/* 受け取った順(position 順)のまま、画像を1枚ずつ表示する */}
      {media.map((item) => (
        <img
          // 投稿の中で画像を見分ける目印(position は 1〜4 で重ならない)
          key={item.position}
          className="media-grid-image"
          // 画像は保存せず、URL を参照するだけ
          src={item.url}
          // 画像が読めないときや、読み上げソフト用の説明
          alt={`投稿の画像 ${item.position}枚目`}
          // 画面に近づいてから読み込む(一覧の表示を軽くする)
          loading="lazy"
        />
      ))}
    </div>
  )
}

// ほかのファイルから読み込めるようにする
export default MediaGrid
