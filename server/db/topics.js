// DB接続の置き場(プール)を読み込む
import pool from './connection.js'

// トピックの一覧を、id の順に取り出す(タブの表示用)
export async function findAllTopics() {
  // 画面に必要な項目だけを選ぶ(取得条件の query_type や query_value は返さない)
  const [rows] = await pool.query(
    `SELECT id, name, last_fetched_at
       FROM topics
      ORDER BY id`,
  )

  // トピックの配列を返す
  return rows
}

// 指定した id のトピックがあるか調べる(あれば true、なければ false)
export async function existsTopic(topicId) {
  // 中身は使わないので、あるかどうかだけが分かる「1」を1行だけ取り出す
  const [rows] = await pool.query(
    `SELECT 1
       FROM topics
      WHERE id = ?
      LIMIT 1`,
    [topicId],
  )

  // 1行でも返れば、そのトピックはある
  return rows.length > 0
}

// 取得(API 2)に使う情報を、指定したトピックについて取り出す(トピックがなければ null)
export async function findTopicForRefresh(topicId) {
  // 取得条件(query_type、query_value)と、前回の取得状況(last_fetched_at、last_post_id)を選ぶ
  const [rows] = await pool.query(
    `SELECT id, query_type, query_value, last_fetched_at, last_post_id
       FROM topics
      WHERE id = ?`,
    [topicId],
  )

  // 1行目を返す。なければ null
  return rows[0] ?? null
}


// 取得が終わったトピックの取得状況を更新する
// lastFetchedAt:今回取得した時刻 / lastPostId:今回までに取った最新の投稿ID
export async function updateFetchState(topicId, lastFetchedAt, lastPostId) {
  // UPDATE は、すでにある行の値を書き換える。WHERE で、書き換える行を1つに絞る
  await pool.query(
    `UPDATE topics
        SET last_fetched_at = ?,
            last_post_id = ?
      WHERE id = ?`,
    [lastFetchedAt, lastPostId, topicId],
  )
}
