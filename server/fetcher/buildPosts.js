// X API v2 の形式の返事(投稿本体・ユーザー情報・画像情報)を、保存できる投稿の形に組み立てる
// sample 用の取得処理でも、あとで追加する X API 用の取得処理でも、同じこの処理を使う

// 文字が入っていないか(文字ではない、または空・空白だけ)を調べる
function isBlank(value) {
    return typeof value !== 'string' || value.trim() === ''
  }
  
  // 返事の中身から、投稿の配列を作る。項目が欠けている投稿は入れずに、ログに記録する
  export function buildPosts(response) {
    // ユーザー情報を、id からすぐ引ける形(id → ユーザー)にまとめる
    const usersById = new Map((response.includes?.users ?? []).map((user) => [user.id, user]))
  
    // 画像情報を、media_key からすぐ引ける形(media_key → 画像)にまとめる
    const mediaByKey = new Map((response.includes?.media ?? []).map((media) => [media.media_key, media]))
  
    const posts = []
  
    // 投稿本体を1件ずつ処理する
    for (const tweet of response.data ?? []) {
      // 投稿の author_id から、投稿者の情報を見つける(見つからなければ undefined)
      const user = usersById.get(tweet.author_id)
  
      // 文字列の日時を、日時として扱える形にする
      const postedAt = new Date(tweet.created_at)
  
      // 投稿の media_keys を画像情報に置き換え、写真(photo)でURLがあるものだけを残して、URLの配列にする
      const mediaUrls = (tweet.attachments?.media_keys ?? [])
        .map((key) => mediaByKey.get(key))
        .filter((media) => media && media.type === 'photo' && !isBlank(media.url))
        .map((media) => media.url)
  
      // 入力チェック:欠けている項目の名前を集める
      const problems = []
      if (isBlank(tweet.id) || !/^\d+$/.test(tweet.id)) {
        problems.push('投稿ID')
      }
      if (!user || isBlank(user.name)) {
        problems.push('投稿者名')
      }
      if (!user || isBlank(user.username)) {
        problems.push('@ID')
      }
      if (isBlank(tweet.text)) {
        problems.push('本文')
      }
      // 日時として読めない文字のときは、getTime() が NaN(数ではない)になる
      if (Number.isNaN(postedAt.getTime())) {
        problems.push('投稿日時')
      }
      if (mediaUrls.length > 4) {
        problems.push('画像が5枚以上')
      }
  
      // 1つでも問題があれば、この投稿だけ入れずに、サーバーのログに記録して次へ進む
      if (problems.length > 0) {
        console.warn(`取得した投稿を保存しません(投稿ID: ${tweet.id ?? '不明'}、問題: ${problems.join('、')})`)
        continue
      }
  
      // 保存できる形に組み立てる
      posts.push({
        x_post_id: tweet.id,
        author_name: user.name,
        author_username: user.username,
        // アイコンURLがないときは空(null)にする
        author_icon_url: user.profile_image_url ?? null,
        text: tweet.text,
        posted_at: postedAt,
        // 元投稿のURLは、@ID と投稿ID から組み立てる
        post_url: `https://x.com/${user.username}/status/${tweet.id}`,
        // 画像のURL(並び順のまま。0〜4件)
        media_urls: mediaUrls,
      })
    }
  
    return posts
  }
  