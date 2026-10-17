// 取得処理の入口:.env の取得元(FETCH_SOURCE)に応じて、使う取得処理を切り替える

// sample 用の取得処理を読み込む
import { fetchFromSample } from './sampleFetcher.js'

// 取得元の名前と、取得処理の対応表
// X API に切り替えるときは、X API 用の取得処理を作り、ここに x の行を足す
const FETCHERS = {
  sample: fetchFromSample,
}

// 1時間の長さ(ミリ秒)
const ONE_HOUR_MS = 60 * 60 * 1000

// .env の値を、数に直して返す。空なら null(その絞り込みは働かない)
// 値の形(1以上の整数)は、起動時に checkEnv.js で確かめてある
function readOptionalNumber(key) {
  const value = (process.env[key] ?? '').trim()
  return value === '' ? null : Number(value)
}

// 取りに行く量の絞り込みを、.env から組み立てる(取得元がどれでも、同じ形で渡す)
// startTime:この日時より前の投稿は取らない(null なら絞らない)
// maxCount:1回に取る件数の上限。新しいものを優先する(null なら絞らない)
function buildFetchOptions() {
  const rangeHours = readOptionalNumber('FETCH_RANGE_HOURS')
  return {
    // 今から、さかのぼる範囲(時間)だけ前の日時
    startTime: rangeHours === null ? null : new Date(Date.now() - rangeHours * ONE_HOUR_MS),
    maxCount: readOptionalNumber('FETCH_MAX_COUNT'),
  }
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

    // トピックと、取りに行く量の絞り込みを渡す
    return fetcher(topic, buildFetchOptions())
}
