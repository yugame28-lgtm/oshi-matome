// APIの入口をまとめるための道具(Router)を読み込む
import { Router } from 'express'
// 投稿を取り出す処理・お気に入りを書き換える処理を読み込む(SQLは db の中にだけ書く)
import { findPostsByTopicId, updateFavorite, findFavoritePosts } from '../db/posts.js'
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

// URL に書かれた id が、正の整数(1以上)かどうかを調べる
function isPositiveId(value) {
  return isDigits(value) && Number(value) >= 1
}

// DB から取り出した投稿を、画面に返す形に整える(投稿一覧と、お気に入りの一覧で共通)
// ・各投稿に、画像の配列(media)を付ける
// ・is_favorite を、0 / 1 から true / false に直す
async function formatPosts(posts) {
  // 投稿の画像を、1回の問い合わせでまとめて取り出す
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

  // 各投稿に media を付け(画像がない投稿は空の配列)、is_favorite を true / false にする
  return posts.map((post) => ({
    ...post,
    is_favorite: post.is_favorite === 1,
    media: mediaByPostId.get(post.id) ?? [],
  }))
}

// API 3:トピックの投稿一覧を、20件ずつ返す
// :topicId の部分には、URLに書かれた値が入る(/topics/1/posts なら 1)
router.get('/topics/:topicId/posts', async (req, res) => {
  try {
    // ① topicId の形を確かめる(数字だけで、1以上)。だめなら 400 を返して終わる
    if (!isPositiveId(req.params.topicId)) {
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

    // { posts: [...], has_more: true/false } の形の JSON で返す
    res.json({ posts: await formatPosts(posts), has_more: hasMore })
  } catch (error) {
    // 失敗したときは、原因をサーバーのターミナルに表示する
    console.error('投稿一覧の取得に失敗しました:', error.message)

    // 画面側には、ステータス 500 と error(メッセージ)を返す
    res.status(500).json({ error: '投稿一覧の取得に失敗しました' })
  }
})

// API 4:お気に入りを付ける・外す
// 送るもの:{ "is_favorite": true }(付ける)/ { "is_favorite": false }(外す)
// PUT は「この状態にする」という意味。同じものを2回送っても、結果は変わらない
router.put('/posts/:postId/favorite', async (req, res) => {
  try {
    // ① postId の形を確かめる(数字だけで、1以上)。だめなら 400 を返して終わる
    if (!isPositiveId(req.params.postId)) {
      return res.status(400).json({ error: 'postId は正の整数で指定してください' })
    }
    const postId = Number(req.params.postId)

    // ② is_favorite が true か false かを確かめる("true" のような文字や、1 のような数は不可)
    // JSON が送られてこなかったときは req.body が undefined になるので、?. で読む
    const isFavorite = req.body?.is_favorite
    if (typeof isFavorite !== 'boolean') {
      return res.status(400).json({ error: 'is_favorite は true か false で指定してください' })
    }

    // ③ 書き換える。投稿がなければ(保存期間を過ぎて消えた投稿など)404 を返して終わる
    if (!(await updateFavorite(postId, isFavorite))) {
      return res.status(404).json({ error: '投稿が見つかりません' })
    }

    // { id, is_favorite } の形の JSON で返す
    res.json({ id: postId, is_favorite: isFavorite })
  } catch (error) {
    console.error('お気に入りの変更に失敗しました:', error.message)
    res.status(500).json({ error: 'お気に入りの変更に失敗しました' })
  }
})

// API 5:お気に入りの一覧を返す(トピックに関係なく、投稿日時の新しい順。件数の上限なし)
router.get('/favorites', async (req, res) => {
  try {
    const posts = await findFavoritePosts()

    // { posts: [...] } の形の JSON で返す(1件の形は API 3 と同じ)
    res.json({ posts: await formatPosts(posts) })
  } catch (error) {
    console.error('お気に入りの一覧の取得に失敗しました:', error.message)
    res.status(500).json({ error: 'お気に入りの一覧の取得に失敗しました' })
  }
})

// index.js から読み込めるようにする
export default router
