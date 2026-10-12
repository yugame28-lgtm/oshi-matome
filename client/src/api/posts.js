// API 3 を呼んで、トピックの投稿を offset の位置から20件取得する
export async function fetchPosts(topicId, offset = 0) {
  // サーバーに投稿一覧を要求する(?offset= で、何件目から読むかを伝える)
  const response = await fetch(`/api/topics/${topicId}/posts?offset=${offset}`)

  // 失敗の返事(404 や 500 など)なら、エラーとして呼び出し元に知らせる
  if (!response.ok) {
    throw new Error(`投稿一覧の読み込みに失敗しました(ステータス: ${response.status})`)
  }

  // 返事の中身(JSON)を、JavaScript で扱える形に直す
  const data = await response.json()

  // { posts: [...], has_more: true/false } をそのまま返す(仮のAPIと同じ形)
  return data
}
