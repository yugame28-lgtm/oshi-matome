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
    'FETCH_INTERVAL_HOURS',
  ]
  
  // 値が入っていないか(項目そのものがない、または空・空白だけ)を調べる
  function isMissing(key) {
    // 項目がなければ undefined なので、空の文字として扱う。前後の空白を取り除いて、空かどうかを見る
    return (process.env[key] ?? '').trim() === ''
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
  