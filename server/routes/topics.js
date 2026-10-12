// APIの入口をまとめるための道具(Router)を読み込む
import { Router } from 'express'
// トピックを取り出す処理を読み込む(SQLは db の中にだけ書く)
import { findAllTopics } from '../db/topics.js'

// このファイル用の入口のまとまりを作る
const router = Router()

// API 1:トピックの一覧を返す
router.get('/topics', async (req, res) => {
  try {
    // DBからトピックを取り出す(結果が返るまで待つ)
    const topics = await findAllTopics()

    // { topics: [...] } の形の JSON で返す
    res.json({ topics })
  } catch (error) {
    // 失敗したときは、原因をサーバーのターミナルに表示する
    console.error('トピック一覧の取得に失敗しました:', error.message)

    // 画面側には、ステータス 500 と error(メッセージ)を返す
    res.status(500).json({ error: 'トピック一覧の取得に失敗しました' })
  }
})

// index.js から読み込めるようにする
export default router
