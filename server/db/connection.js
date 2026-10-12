// mysql2 の、結果を待てる書き方(Promise)に対応した版を読み込む
import mysql from 'mysql2/promise'

// 接続の置き場(プール)を作る。必要なときにここから接続を借りて、終わったら返す
const pool = mysql.createPool({
  // 接続情報は .env から読む(起動時に --env-file=.env で読み込まれている)
  host: process.env.DB_HOST,
  // .env の値は文字列なので、ポート番号は数値に直す
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // 文字コードは utf8mb4(絵文字対応)。テーブルと同じ照合順序を指定する
  charset: 'utf8mb4_unicode_ci',
  // 日時は UTC としてやり取りする
  timezone: 'Z',
})

// 接続できるか確かめる(topics の件数を数えて返す)
export async function checkConnection() {
  // 結果は [行の配列, 列の情報] の形で返るので、行の配列だけを受け取る
  const [rows] = await pool.query('SELECT COUNT(*) AS topicCount FROM topics')
  // 1行目の topicCount が件数
  return rows[0].topicCount
}

// ほかのファイル(SQLを書く処理)から、このプールを使えるようにする
export default pool
