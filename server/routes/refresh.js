// APIの入口をまとめるための道具(Router)を読み込む
import { Router } from 'express'
// トピックの取得状況を読む処理・更新する処理を読み込む
import { findTopicsForRefresh, updateFetchState } from '../db/topics.js'
// 取ってきた投稿を保存する処理を読み込む
import { savePosts } from '../db/savePosts.js'
// 新しい投稿を取ってくる処理(取得元は .env で切り替わる)を読み込む
import { fetchNewPosts } from '../fetcher/index.js'

// このファイル用の入口のまとまりを作る
const router = Router()

// 1時間の長さ(ミリ秒)
const ONE_HOUR_MS = 60 * 60 * 1000

// API 2:トピックごとに、必要なら新しい投稿を取りに行って保存する
// データを書き換えるAPIなので、GET(読むだけ)ではなく POST を使う
router.post('/refresh', async (req, res) => {
  try {
    // すべてのトピックの、取得条件と前回の取得状況を読む
    const topics = await findTopicsForRefresh()

    // 取得間隔(.env の FETCH_INTERVAL_HOURS。時間をミリ秒に直す)
    const intervalMs = Number(process.env.FETCH_INTERVAL_HOURS) * ONE_HOUR_MS

    // 今の時刻(この1回の取得で共通の値にする)
    const now = new Date()

    // トピックごとの結果を入れる配列
    const results = []

    for (const topic of topics) {
      // 6時間ルール:前回の取得から取得間隔がたっていなければ、取りに行かない
      // 日時どうしの引き算は、差のミリ秒になる。一度も取っていない(null)ときは、必ず取りに行く
      if (topic.last_fetched_at !== null && now - topic.last_fetched_at < intervalMs) {
        results.push({ topic_id: topic.id, status: 'skipped', new_count: 0 })
        continue
      }

      // 1つのトピックの失敗が、ほかのトピックに影響しないよう、トピックごとに try で囲む
      try {
        // 差分取得:前回取った最新の投稿IDより新しい投稿だけを取ってくる
        const { posts, newestId } = await fetchNewPosts(topic)

        // 取ってきた投稿を保存し、新しく保存できた件数を受け取る
        const newCount = await savePosts(topic.id, posts, now)

        // 取得状況を更新する(今取った、ここまで取った)
        await updateFetchState(topic.id, now, newestId)

        results.push({ topic_id: topic.id, status: 'fetched', new_count: newCount })
      } catch (error) {
        // このトピックだけ失敗として記録し、次のトピックへ進む(取得状況は更新しないので、次に開いたときにもう一度試す)
        console.error(`トピック ${topic.id} の取得に失敗しました:`, error.message)
        results.push({ topic_id: topic.id, status: 'failed', new_count: 0 })
      }
    }

    // { results: [...] } の形の JSON で返す
    res.json({ results })
  } catch (error) {
    // トピックの一覧が読めないなど、全体が失敗したときは、原因をサーバーのターミナルに表示する
    console.error('取得に失敗しました:', error.message)

    // 画面側には、ステータス 500 と error(メッセージ)を返す
    res.status(500).json({ error: '取得に失敗しました' })
  }
})

// index.js から読み込めるようにする
export default router
