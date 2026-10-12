// DB接続の置き場(プール)を読み込む
import pool from './connection.js'

// 1回に返す件数(設計書で20件固定)
const PAGE_SIZE = 20

// 投稿を1件保存する
// 保存できたら、新しく付いた投稿の id を返す。同じトピックに同じ投稿IDがすでにあって保存しなかったら null を返す
export async function insertPost(post) {
  // IGNORE を付けると、重複のときにエラーにせず、その行を保存しないだけになる
  // ? は値の入る場所。値は下の配列で、同じ順番で渡す(SQLに直接つなげないことで安全になる)
  const [result] = await pool.query(
    `INSERT IGNORE INTO posts
       (topic_id, x_post_id, author_name, author_username, author_icon_url,
        text, posted_at, post_url, fetched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      post.topic_id,
      post.x_post_id,
      post.author_name,
      post.author_username,
      post.author_icon_url,
      post.text,
      post.posted_at,
      post.post_url,
      post.fetched_at,
    ],
  )

  // affectedRows は実際に保存された行数(保存できたら 1、重複なら 0)
  // insertId は、MySQL が自動で付けた新しい id
  return result.affectedRows === 1 ? result.insertId : null
}

// トピックの投稿を、新しい順に offset の位置から20件取り出す
// 続きがあるかを調べるため、1件多く(21件)取り出してみる
export async function findPostsByTopicId(topicId, offset) {
  // 画面に必要な項目だけを選ぶ
  // 並び順は、投稿日時の新しい順。同じ日時なら id の大きい順
  // LIMIT は取り出す件数、OFFSET は先頭から飛ばす件数
  const [rows] = await pool.query(
    `SELECT id, author_name, author_username, author_icon_url,
            text, posted_at, post_url
       FROM posts
      WHERE topic_id = ?
      ORDER BY posted_at DESC, id DESC
      LIMIT ? OFFSET ?`,
    [topicId, PAGE_SIZE + 1, offset],
  )

  // 21件目があれば、続きがある
  const hasMore = rows.length > PAGE_SIZE

  // 返すのは20件まで(21件目は、続きがあるかを調べるためだけに使う)
  return { posts: rows.slice(0, PAGE_SIZE), hasMore }
}
