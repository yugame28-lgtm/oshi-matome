// APIの入口をまとめるための道具(Router)を読み込む
import { Router } from 'express'
// 投稿を取り出す処理を読み込む(SQLは db の中にだけ書く)
import { findPostsByTopicId } from '../db/posts.js'
// 画像を取り出す処理を読み込む
import { findMediaByPostIds } from '../db/media.js'
// トピックがあるか調べる処理を読み込む
import { existsTopic } from '../db/topics.js'

// このファイル用の入口のまとまりを作る
const router = Router()

// 数字だけでできた文字かどうかを調べる(マイナス・小数・空・文字まじりは false)
function isDigits(value) {
  // ^ は先頭、$ は末尾、\d は数字1文字、+ は1文字以上のくり返し。つまり「最初から最後まで数字だけ」
  return typeof value === 'string' && /^\d+$/.test(value)
}

// API 3:トピックの投稿一覧を、20件ずつ返す
// :topicId の部分には、URLに書かれた値が入る(/topics/1/posts なら 1)
router.get('/topics/:topicId/posts', async (req, res) => {
  try {
    // ① topicId の形を確かめる(数字だけで、1以上)。だめなら 400 を返して終わる
    if (!isDigits(req.params.topicId) || Number(req.params.topicId) < 1) {
      return res.status(400).json({ error: 'topicId は正の整数で指定してください' })
    }
    const topicId = Number(req.params.topicId)

    // ② offset の形を確かめる(URL の ?offset=20 の部分。省略時は0)。だめなら 400 を返して終わる
    let offset = 0
    if (req.query.offset !== undefined) {
      if (!isDigits(req.query.offset)) {
        return res.status(400).json({ error: 'offset は0以上の整数で指定してください' })
      }
      offset = Number(req.query.offset)
    }

    // ③ そのトピックがあるか確かめる。なければ 404 を返して終わる
    if (!(await existsTopic(topicId))) {
      return res.status(404).json({ error: 'トピックが見つかりません' })
    }

    // DBから投稿を20件と、続きがあるかを取り出す
    const { posts, hasMore } = await findPostsByTopicId(topicId, offset)

    // 取り出した投稿の画像を、1回の問い合わせでまとめて取り出す
    const mediaRows = await findMediaByPostIds(posts.map((post) => post.id))

    // 画像を、投稿の id ごとの配列に振り分ける(投稿の id → 画像の配列)
    const mediaByPostId = new Map()
    for (const row of mediaRows) {
      // その投稿の配列がまだなければ、空の配列を用意する
      if (!mediaByPostId.has(row.post_id)) {
        mediaByPostId.set(row.post_id, [])
      }
      // 画面に必要な url と position だけを入れる
      mediaByPostId.get(row.post_id).push({ url: row.url, position: row.position })
    }

    // 各投稿に media を付ける(画像がない投稿は空の配列)
    const postsWithMedia = posts.map((post) => ({
      ...post,
      media: mediaByPostId.get(post.id) ?? [],
    }))

    // { posts: [...], has_more: true/false } の形の JSON で返す
    res.json({ posts: postsWithMedia, has_more: hasMore })
  } catch (error) {
    // 失敗したときは、原因をサーバーのターミナルに表示する
    console.error('投稿一覧の取得に失敗しました:', error.message)

    // 画面側には、ステータス 500 と error(メッセージ)を返す
    res.status(500).json({ error: '投稿一覧の取得に失敗しました' })
  }
})

// index.js から読み込めるようにする
export default router
