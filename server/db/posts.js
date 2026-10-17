// DB接続の置き場(プール)を読み込む
import pool from './connection.js'

// 1回に返す件数(設計書で20件固定)
const PAGE_SIZE = 20

// 画面に返す投稿の項目(投稿一覧と、お気に入りの一覧で共通)
// is_favorite は、DB からは 0 / 1 の数で届く(true / false に直すのは routes で行う)
const POST_COLUMNS = `id, author_name, author_username, author_icon_url,
                      text, posted_at, post_url, is_favorite`

// 投稿を1件保存する
// 保存できたら、新しく付いた投稿の id を返す。同じトピックに同じ投稿IDがすでにあって保存しなかったら null を返す
export async function insertPost(post) {
  // IGNORE を付けると、重複のときにエラーにせず、その行を保存しないだけになる
  // ? は値の入る場所。値は下の配列で、同じ順番で渡す(SQLに直接つなげないことで安全になる)
  // is_favorite は指定しないので、初期値の FALSE(お気に入りではない)が入る
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
  // 並び順は、投稿日時の新しい順。同じ日時なら id の大きい順
  // LIMIT は取り出す件数、OFFSET は先頭から飛ばす件数
  const [rows] = await pool.query(
    `SELECT ${POST_COLUMNS}
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

// 投稿のお気に入りの印を、isFavorite(true / false)にする
// 投稿があれば true、なければ(消えた投稿など)false を返す
export async function updateFavorite(postId, isFavorite) {
  const [result] = await pool.query(
    `UPDATE posts
        SET is_favorite = ?
      WHERE id = ?`,
    [isFavorite, postId],
  )

  // affectedRows は、条件(WHERE)に合った行の数
  // mysql2 の初期設定では、値が変わらなかった行も数えるので、すでに同じ状態でも 1 になる
  return result.affectedRows === 1
}

// お気に入りの投稿を、トピックに関係なく、すべて取り出す(件数の上限なし)
export async function findFavoritePosts() {
  // 並び順は、投稿一覧と同じく、投稿日時の新しい順。同じ日時なら id の大きい順
  const [rows] = await pool.query(
    `SELECT ${POST_COLUMNS}
       FROM posts
      WHERE is_favorite = TRUE
      ORDER BY posted_at DESC, id DESC`,
  )
  return rows
}

// 保存期間を過ぎた投稿を消す(お気に入りは消さない)
// expiredBefore:この日時より前に取り込んだ(fetched_at)投稿が対象。消した件数を返す
// 画像(media)は、表の決まり(ON DELETE CASCADE)で、投稿と一緒に消える
export async function deleteExpiredPosts(topicId, expiredBefore) {
  const [result] = await pool.query(
    `DELETE FROM posts
      WHERE topic_id = ?
        AND fetched_at < ?
        AND is_favorite = FALSE`,
    [topicId, expiredBefore],
  )

  // affectedRows は、消した行の数
  return result.affectedRows
}
