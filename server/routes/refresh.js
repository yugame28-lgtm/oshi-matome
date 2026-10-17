// APIの入口をまとめるための道具(Router)を読み込む
import { Router } from 'express'
// トピックの取得状況を読む処理・更新する処理を読み込む
import { findTopicForRefresh, updateFetchState } from '../db/topics.js'
// 取ってきた投稿を保存する処理を読み込む
import { savePosts } from '../db/savePosts.js'
// 保存期間を過ぎた投稿を消す処理を読み込む
import { deleteExpiredPosts } from '../db/posts.js'
// 新しい投稿を取ってくる処理(取得元は .env で切り替わる)を読み込む
import { fetchNewPosts } from '../fetcher/index.js'

// このファイル用の入口のまとまりを作る
const router = Router()

// 1日の長さ(ミリ秒)
const ONE_DAY_MS = 24 * 60 * 60 * 1000

// URL に書かれた id が、正の整数(1以上)かどうかを調べる
function isPositiveId(value) {
  return typeof value === 'string' && /^\d+$/.test(value) && Number(value) >= 1
}

// 保存する日数(.env の RETENTION_DAYS)を、数に直して返す。空なら null(古い投稿を消さない)
// 値の形(1以上の整数)は、起動時に checkEnv.js で確かめてある
function readRetentionDays() {
  const value = (process.env.RETENTION_DAYS ?? '').trim()
  return value === '' ? null : Number(value)
}

// API 2:指定したトピックの新しい投稿を取りに行って保存し、保存期間を過ぎた投稿を消す
// データを書き換えるAPIなので、GET(読むだけ)ではなく POST を使う
router.post('/topics/:topicId/refresh', async (req, res) => {
  // ① topicId の形を確かめる(数字だけで、1以上)。だめなら 400 を返して終わる
  if (!isPositiveId(req.params.topicId)) {
    return res.status(400).json({ error: 'topicId は正の整数で指定してください' })
  }
  const topicId = Number(req.params.topicId)

  try {
    // ② トピックの取得条件と、前回の取得状況を読む。トピックがなければ 404 を返して終わる
    const topic = await findTopicForRefresh(topicId)
    if (topic === null) {
      return res.status(404).json({ error: 'トピックが見つかりません' })
    }

    // 今の時刻(この1回の取得で共通の値にする)
    const now = new Date()

    // ③ 差分取得:前回取った最新の投稿IDより新しい投稿だけを取ってきて保存し、取得状況を更新する
    const { posts, newestId } = await fetchNewPosts(topic)
    const newCount = await savePosts(topic.id, posts, now)
    await updateFetchState(topic.id, now, newestId)

    // ④ 取得に成功したので、保存期間を過ぎた投稿を消す(保存する日数が空なら、消さない)
    // 消すのに失敗しても、取得そのものは成功しているので、失敗の返事にはしない(次の取得のときに、また消す)
    let deletedCount = 0
    const retentionDays = readRetentionDays()
    if (retentionDays !== null) {
      try {
        // 今から、保存する日数だけ前の日時。これより前に取り込んだ投稿が、消す対象
        const expiredBefore = new Date(now.getTime() - retentionDays * ONE_DAY_MS)
        deletedCount = await deleteExpiredPosts(topic.id, expiredBefore)
      } catch (error) {
        console.error(`トピック ${topic.id} の古い投稿を消せませんでした:`, error.message)
      }
    }

    // { topic_id, status, new_count, deleted_count } の形の JSON で返す
    res.json({ topic_id: topic.id, status: 'fetched', new_count: newCount, deleted_count: deletedCount })
  } catch (error) {
    // 取得や保存に失敗したときは、原因をサーバーのターミナルに表示する
    // 取得状況は更新しないので、次に取得したときに、同じところからもう一度試す。古い投稿も消さない
    console.error(`トピック ${topicId} の取得に失敗しました:`, error.message)

    // 画面側には、ステータス 500 と error(メッセージ)を返す
    res.status(500).json({ error: '取得に失敗しました' })
  }
})

// index.js から読み込めるようにする
export default router
