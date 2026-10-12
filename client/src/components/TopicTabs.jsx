// この部品専用のCSSを読み込む
import './TopicTabs.css'

// トピックのタブを並べる部品
// topics:トピックの一覧 / selectedTopicId:選択中のトピックの id / onSelect:タブが押されたときに呼ぶ関数
function TopicTabs({ topics, selectedTopicId, onSelect }) {
  return (
    <div className="topic-tabs">
      {/* トピック1件につき、タブ(ボタン)を1つ作る */}
      {topics.map((topic) => {
        // このタブが選択中かどうか
        const isSelected = topic.id === selectedTopicId

        return (
          <button
            key={topic.id}
            // フォームの送信ボタンとして扱われないようにする
            type="button"
            // 選択中なら、強調用のクラスを追加で付ける
            className={isSelected ? 'topic-tab topic-tab-selected' : 'topic-tab'}
            // 読み上げソフトに「押された状態か」を伝える
            aria-pressed={isSelected}
            // 押されたら、どのトピックが選ばれたかを App に知らせる
            onClick={() => onSelect(topic.id)}
          >
            {topic.name}
          </button>
        )
      })}
    </div>
  )
}

// ほかのファイルから読み込めるようにする
export default TopicTabs
