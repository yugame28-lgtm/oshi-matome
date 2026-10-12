// sample 用の取得処理:サンプルデータのファイルから、新しい投稿を取ってくる
// X API の代わりなので、受け取るものと返すものは、あとで追加する X API 用と同じ形にする

// ファイルを読むための、Node.js 標準の道具を読み込む
import { readFile } from 'node:fs/promises'
// X API v2 の形式の返事を、保存できる投稿の形に組み立てる処理を読み込む
import { buildPosts } from './buildPosts.js'

// 取得条件の種類ごとの、サンプルファイルの一覧
// 「-added」は追加分(あとから増えた投稿)。ファイルがなければ、まだ投稿が増えていないものとして扱う
const SAMPLE_FILES = {
  user: ['oshi-posts.json', 'oshi-posts-added.json'],
  hashtag: ['fanart-posts.json', 'fanart-posts-added.json'],
}

// サンプルファイルを1つ読み、JavaScript で扱える形に直す。ファイルがなければ null を返す
async function readSampleFile(fileName) {
  // サンプルデータの場所(このファイルから見た位置で指定する)
  const sampleUrl = new URL(`../sample/${fileName}`, import.meta.url)

  try {
    const json = await readFile(sampleUrl, 'utf8')
    return JSON.parse(json)
  } catch (error) {
    // ENOENT は「その場所にファイルがない」という意味。追加分がまだないだけなので、失敗にしない
    if (error.code === 'ENOENT') {
      return null
    }
    // それ以外(JSON の書き方の誤りなど)は、本当の失敗として呼び出し元に知らせる
    throw error
  }
}

// 投稿IDの新しい順(大きい順)に並べるための比べ方
// 投稿IDは桁が多く、普通の数値では正確に比べられないので、大きな整数(BigInt)に直して比べる
function compareNewestFirst(a, b) {
  const idA = BigInt(a.x_post_id)
  const idB = BigInt(b.x_post_id)
  if (idA === idB) {
    return 0
  }
  return idA < idB ? 1 : -1
}

// トピックの新しい投稿を取ってくる
// 受け取るもの:トピック(query_type と、前回取った最新の投稿ID last_post_id を使う)
// 返すもの:{ posts: 前回より新しい投稿(新しい順), newestId: 今回までの最新の投稿ID }
export async function fetchFromSample(topic) {
  // このトピックの取得条件に対応する、サンプルファイルの一覧
  const fileNames = SAMPLE_FILES[topic.query_type] ?? []

  // ファイルを順に読み、投稿の形に組み立てて、1つの配列に集める
  const allPosts = []
  for (const fileName of fileNames) {
    const response = await readSampleFile(fileName)
    if (response === null) {
      continue
    }
    allPosts.push(...buildPosts(response))
  }

  // 差分取得:前回取った最新の投稿IDより新しいものだけを残す(一度も取っていなければ、すべて)
  const newPosts =
    topic.last_post_id === null
      ? allPosts
      : allPosts.filter((post) => BigInt(post.x_post_id) > BigInt(topic.last_post_id))

  // 新しい順に並べる
  newPosts.sort(compareNewestFirst)

  // 今回までの最新の投稿ID(新しい投稿がなければ、前回の値のまま)
  const newestId = newPosts.length > 0 ? newPosts[0].x_post_id : topic.last_post_id

  return { posts: newPosts, newestId }
}
