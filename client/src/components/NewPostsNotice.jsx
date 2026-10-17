// この部品専用のCSSを読み込む
import './NewPostsNotice.css'

// 新しい投稿があることを知らせる部品(onShow に、押されたときに呼ぶ関数を受け取る)
function NewPostsNotice({ onShow }) {
  return (
    // 高さ0の入れ物を、画面の上のほうにとどめる。中のボタンが、一覧に重なって見える
    <div className="new-posts-notice">
      <button type="button" className="new-posts-notice-button" onClick={onShow}>
        最新の投稿があります
      </button>
    </div>
  )
}

// ほかのファイルから読み込めるようにする
export default NewPostsNotice
