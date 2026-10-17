// この部品専用のCSSを読み込む
import './RefreshMessage.css'

// 更新ボタンを押して、新しい投稿がなかったことを知らせる部品(押せない、表示だけの部品)
function RefreshMessage() {
  return (
    // 高さ0の入れ物を、画面の上のほうにとどめる。中の文字が、一覧に重なって見える
    <div className="refresh-message">
      {/* role="status" は、読み上げソフトに「お知らせが出た」と伝えるための目印 */}
      <p className="refresh-message-text" role="status">
        新しい投稿はありません
      </p>
    </div>
  )
}

// ほかのファイルから読み込めるようにする
export default RefreshMessage
