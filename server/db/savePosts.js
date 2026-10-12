// 取ってきた投稿を、画像と一緒に保存する(SQLそのものは posts.js と media.js に書いてある)

// 投稿を1件保存する処理を読み込む
import { insertPost } from './posts.js'
// 画像を1枚保存する処理を読み込む
import { insertMedia } from './media.js'

// 投稿の配列を、指定したトピックに保存する
// posts:取得処理(fetcher)が組み立てた投稿の配列 / fetchedAt:取り込んだ日時
// 新しく保存できた件数を返す(すでに保存済みの投稿は数えない)
export async function savePosts(topicId, posts, fetchedAt) {
  let newCount = 0

  // 投稿を1件ずつ保存する
  for (const post of posts) {
    // どのトピックの投稿か、いつ取り込んだかを足して保存する(保存できたら新しい id、重複なら null が返る)
    const postId = await insertPost({
      topic_id: topicId,
      x_post_id: post.x_post_id,
      author_name: post.author_name,
      author_username: post.author_username,
      author_icon_url: post.author_icon_url,
      text: post.text,
      posted_at: post.posted_at,
      post_url: post.post_url,
      fetched_at: fetchedAt,
    })

    // 重複で保存しなかった投稿は、画像も保存しない
    if (postId === null) {
      continue
    }
    newCount += 1

    // 画像を、並び順(1枚目、2枚目…)を付けて保存する
    for (const [index, url] of post.media_urls.entries()) {
      await insertMedia(postId, url, index + 1)
    }
  }

  return newCount
}
