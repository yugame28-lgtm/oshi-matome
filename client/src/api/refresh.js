// API 2 を呼んで、新しい投稿を取りに行ってもらう
export async function refreshPosts() {
    // データを書き換えるAPIなので、method に POST を指定する(指定しないと GET になる)
    const response = await fetch('/api/refresh', { method: 'POST' })
  
    // 失敗の返事(500 など)なら、エラーとして呼び出し元に知らせる
    if (!response.ok) {
      throw new Error(`取得に失敗しました(ステータス: ${response.status})`)
    }
  
    // 返事の中身(JSON)を、JavaScript で扱える形に直す
    const data = await response.json()
  
    // { results: [...] } の中の、トピックごとの結果の配列だけを返す(仮の API 2 と同じ形)
    return data.results
  }
  