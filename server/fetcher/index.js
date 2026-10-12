// 取得処理の入口:.env の取得元(FETCH_SOURCE)に応じて、使う取得処理を切り替える

// sample 用の取得処理を読み込む
import { fetchFromSample } from './sampleFetcher.js'

// 取得元の名前と、取得処理の対応表
// X API に切り替えるときは、X API 用の取得処理を作り、ここに x の行を足す
const FETCHERS = {
  sample: fetchFromSample,
}

// トピックの新しい投稿を取ってくる(取得元がどれでも、受け取るものと返すものの形は同じ)
// 返すもの:{ posts: 前回より新しい投稿(新しい順), newestId: 今回までの最新の投稿ID }
export async function fetchNewPosts(topic) {
  // .env で指定された取得元の名前から、取得処理を選ぶ
  const source = process.env.FETCH_SOURCE
  const fetcher = FETCHERS[source]

  // 対応する取得処理がなければ、失敗として呼び出し元に知らせる
  if (!fetcher) {
    throw new Error(`取得元「${source}」の取得処理がありません`)
  }

  return fetcher(topic)
}
