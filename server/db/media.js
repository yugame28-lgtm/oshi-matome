// DB接続の置き場(プール)を読み込む
import pool from './connection.js'

// 画像を1枚保存する(postId:どの投稿の画像か / url:画像のURL / position:並び順 1〜4)
// 保存できたら true、同じ投稿に同じ並び順の画像がすでにあって保存しなかったら false を返す
export async function insertMedia(postId, url, position) {
  // IGNORE を付けると、重複のときにエラーにせず、その行を保存しないだけになる
  const [result] = await pool.query(
    `INSERT IGNORE INTO media (post_id, url, position)
     VALUES (?, ?, ?)`,
    [postId, url, position],
  )

  // affectedRows は実際に保存された行数(保存できたら 1、重複なら 0)
  return result.affectedRows === 1
}


// 複数の投稿の画像を、まとめて取り出す(投稿ごと・並び順の順)
export async function findMediaByPostIds(postIds) {
    // 投稿が0件なら、問い合わせずに空の配列を返す(IN () は SQL の文法エラーになるため)
    if (postIds.length === 0) {
      return []
    }
  
    // IN (?) に配列を渡すと、(155, 156, 157) のように展開される
    const [rows] = await pool.query(
      `SELECT post_id, url, position
         FROM media
        WHERE post_id IN (?)
        ORDER BY post_id, position`,
      [postIds],
    )
  
    // 画像の配列を返す(どの投稿の画像かは post_id で分かる)
    return rows
  }
  
