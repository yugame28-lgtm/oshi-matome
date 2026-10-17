// サーバーの起動前に、.env の必須項目がそろっているか確かめる
// このファイルは読み込まれた時点でチェックを実行し、足りなければサーバーを起動せずに終了する

// いつも必要な項目の名前
const REQUIRED_KEYS = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'FETCH_SOURCE',
  ]

// 空でもよい数の項目の名前(空なら、その決まりは働かない)
// 保存する日数、さかのぼる範囲(時間)、1回に取る件数の上限
const OPTIONAL_NUMBER_KEYS = ['RETENTION_DAYS', 'FETCH_RANGE_HOURS', 'FETCH_MAX_COUNT']

  // 値が入っていないか(項目そのものがない、または空・空白だけ)を調べる
  function isMissing(key) {
    // 項目がなければ undefined なので、空の文字として扱う。前後の空白を取り除いて、空かどうかを見る
    return (process.env[key] ?? '').trim() === ''
  }
  // 値が1以上の整数か(先頭が1〜9で、あとは0〜9だけの文字)を調べる
// 0 や小数、マイナス、文字が混じったもの(例:3日、abc)は、正しくない値とする
function isPositiveInteger(key) {
  return /^[1-9][0-9]*$/.test(process.env[key].trim())
}

  // 必須の項目のうち、値が入っていないものだけを集める
  const missingKeys = REQUIRED_KEYS.filter(isMissing)
  
  // 取得元が x のときだけ、X APIキーも必須にする
  if (process.env.FETCH_SOURCE === 'x' && isMissing('X_API_KEY')) {
    missingKeys.push('X_API_KEY')
  }
  
  // 1つでも足りなければ、足りない項目を表示して、サーバーを起動せずに終了する
  if (missingKeys.length > 0) {
    console.error('.env の必須項目が足りないため、サーバーを起動しません。')
    console.error(`足りない項目: ${missingKeys.join(', ')}`)
    process.exit(1)
  }
  // 空でもよい数の項目のうち、値が入っていて、1以上の整数になっていないものだけを集める
const invalidKeys = OPTIONAL_NUMBER_KEYS.filter((key) => !isMissing(key) && !isPositiveInteger(key))

// 1つでも正しくなければ、その項目を表示して、サーバーを起動せずに終了する
// (間違った値のまま動くと、投稿がすべて消える・何も取れない、などが起きるため)
if (invalidKeys.length > 0) {
  console.error('.env の項目に、正しくない値があるため、サーバーを起動しません。')
  console.error(`1以上の整数にするか、空にしてください: ${invalidKeys.join(', ')}`)
  process.exit(1)
}