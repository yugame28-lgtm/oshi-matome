// .env の必須項目のチェックを、ほかのどの読み込みよりも先に実行する
import './checkEnv.js'

// Express(APIを作るための道具)を読み込む
import express from 'express'
// DBに接続できるか確かめる処理を読み込む
import { checkConnection } from './db/connection.js'

// 投稿のAPIの入口を読み込む
import postsRouter from './routes/posts.js'

// トピックのAPIの入口を読み込む
import topicsRouter from './routes/topics.js'

// 取得のAPIの入口を読み込む
import refreshRouter from './routes/refresh.js'

// サーバー本体を作る
const app = express()

// 送られてきた JSON(お気に入りの付け外しなど)を読んで、req.body に入れる
// 各 API の入口より先に置く(先に読んでおかないと、入口で req.body が使えない)
app.use(express.json())

// /api で始まるURLを、トピックのAPIの入口にも渡す
app.use('/api', topicsRouter)

// /api で始まるURLを、取得のAPIの入口にも渡す
app.use('/api', refreshRouter)

// /api で始まるURLを、投稿のAPIの入口に渡す
app.use('/api', postsRouter)

// 各 API の try で受け止められなかったエラー(送られてきた JSON が壊れていたときなど)を、{ error } の形で返す
// 引数が4つの関数は、Express がエラー用の処理として扱う(next は使わないが、4つ並べる必要がある)
// 各 API の入口より後に置く
app.use((error, req, res, next) => {
  // JSON が壊れていたときは、入力チェック違反として 400 を返す
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: '送られてきた JSON の形が正しくありません' })
  }

  // それ以外は、原因をターミナルに表示して、500 を返す
  console.error('予期しないエラーが起きました:', error.message)
  res.status(500).json({ error: 'サーバーでエラーが起きました' })
})

// 待ち受け先(このPCからだけ接続できるアドレス)とポート番号
const HOST = '127.0.0.1'
const PORT = 3000

// 起動時に、DBへ接続できるか確かめる
try {
  // 接続して topics の件数を数える(結果が返るまで待つ)
  const topicCount = await checkConnection()
  console.log(`DBに接続しました(topics: ${topicCount}件)`)
} catch (error) {
  // 失敗したときは原因を表示する(サーバーは止めず、APIが 500 を返す)
  console.error('DBに接続できませんでした:', error.message)
}

// サーバーを起動する
app.listen(PORT, HOST, (error) => {
  // 起動に失敗したとき(ポートが使用中など)は、原因を表示して終了する
  if (error) {
    console.error('サーバーを起動できませんでした:', error.message)
    process.exit(1)
  }

  // 起動できたことをターミナルに表示する
  console.log(`サーバーを起動しました: http://${HOST}:${PORT}`)
})
