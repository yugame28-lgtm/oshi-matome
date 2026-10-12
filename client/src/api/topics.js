// API 1 を呼んで、トピックの一覧を取得する
export async function fetchTopics() {
    // サーバーにトピックの一覧を要求する(返事が来るまで待つ)
    const response = await fetch('/api/topics')
  
    // 失敗の返事(500 など)なら、エラーとして呼び出し元に知らせる
    if (!response.ok) {
      throw new Error(`トピックの読み込みに失敗しました(ステータス: ${response.status})`)
    }
  
    // 返事の中身(JSON)を、JavaScript で扱える形に直す
    const data = await response.json()
  
    // { topics: [...] } の中の、トピックの配列だけを返す(仮のAPIと同じ形)
    return data.topics
  }
  