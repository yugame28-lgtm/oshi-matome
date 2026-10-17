// この部品専用のCSSを読み込む
import './Header.css'

// 最終取得時刻(UTC)を、日本時間の「月/日 時:分」の文字列に変える
function formatFetchedAt(fetchedAt) {
  // 文字列を日時として扱える形にする
  const date = new Date(fetchedAt)

  // 日本時間・2桁そろえ・24時間表記で、年を省いた文字列にする(例:10/03 10:00)
  return date.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
}

// 画面の上部:サイト名と、選択中のトピックの最終取得時刻と、更新ボタンを表示する部品
// lastFetchedAt の受け取り方:
//   undefined(何も渡されない)… トピックがまだ届いていない → 時刻とボタンを表示しない
//   null                     … 一度も取得していない → 「まだありません」
//   日時の文字列             … その時刻を表示する
// isRefreshing:更新ボタンからの取得の最中か / onRefresh:更新ボタンを押したときに呼ぶ関数
function Header({ lastFetchedAt, isRefreshing, onRefresh }) {
  return (
    <header className="header">
      {/* サイト名 */}
      <h1 className="header-title">推しまとめ</h1>

      {/* トピックが届いてから、最終取得時刻と更新ボタンを表示する */}
      {lastFetchedAt !== undefined && (
        <div className="header-side">
          <p className="header-fetched">
            最終取得: {lastFetchedAt === null ? 'まだありません' : formatFetchedAt(lastFetchedAt)}
          </p>

          {/* 更新ボタン(取りに行っている最中は押せなくし、文字を「更新中」にする) */}
          <button
            type="button"
            className="header-refresh"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? '更新中' : '更新'}
          </button>
        </div>
      )}
    </header>
  )
}

// ほかのファイルから読み込めるようにする
export default Header
