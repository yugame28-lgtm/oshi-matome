// API 4 を呼んで、投稿のお気に入りを付ける・外す(isFavorite が true なら付ける、false なら外す)
export async function setFavorite(postId, isFavorite) {
    // 送るもの(JSON)があるので、method に PUT を、headers に「中身は JSON」という印を付ける
    const response = await fetch(`/api/posts/${postId}/favorite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      // JavaScript の値を、JSON の文字に直して送る
      body: JSON.stringify({ is_favorite: isFavorite }),
    })
  
    // 失敗の返事(消えた投稿の 404 など)なら、エラーとして呼び出し元に知らせる
    if (!response.ok) {
      throw new Error(`お気に入りの変更に失敗しました(ステータス: ${response.status})`)
    }
  
    // { id, is_favorite } をそのまま返す(仮の API と同じ形)
    return response.json()
  }
  
  // API 5 を呼んで、お気に入りの一覧を取得する(投稿日時の新しい順)
  export async function fetchFavorites() {
    const response = await fetch('/api/favorites')
  
    // 失敗の返事(500 など)なら、エラーとして呼び出し元に知らせる
    if (!response.ok) {
      throw new Error(`お気に入りの読み込みに失敗しました(ステータス: ${response.status})`)
    }
  
    // { posts: [...] } の中の、投稿の配列だけを返す(仮の API と同じ形)
    const data = await response.json()
    return data.posts
  }
  