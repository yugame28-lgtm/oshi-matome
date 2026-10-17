// API 2 を呼んで、指定したトピックの新しい投稿を取りに行ってもらう(保存期間を過ぎた投稿も、あわせて消える)
export async function refreshTopic(topicId) {
  // データを書き換えるAPIなので、method に POST を指定する(指定しないと GET になる)
  const response = await fetch(`/api/topics/${topicId}/refresh`, { method: 'POST' })

  // 失敗の返事(404 や 500 など)なら、エラーとして呼び出し元に知らせる
  if (!response.ok) {
    throw new Error(`取得に失敗しました(ステータス: ${response.status})`)
  }

  // { topic_id, status, new_count, deleted_count } をそのまま返す(仮の API と同じ形に、deleted_count が足されたもの)
  return response.json()
}
