-- DBを作る(文字コードは utf8mb4。初期設定に頼らず、ここで明示する)
CREATE DATABASE IF NOT EXISTS oshi_matome
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- これ以降の操作の対象を、今作ったDBにする
USE oshi_matome;

-- トピック(タブ1つにつき1行。初期データとして2行だけ登録する)
CREATE TABLE IF NOT EXISTS topics (
  -- 主キー(自動採番にせず、初期データで 1・2 を指定する)
  id INT NOT NULL,
  -- タブの表示名
  name VARCHAR(50) NOT NULL,
  -- 取得条件の種類(user または hashtag)
  query_type VARCHAR(20) NOT NULL,
  -- 取得条件の値(@ や # は付けない)
  query_value VARCHAR(100) NOT NULL,
  -- 最終取得時刻(UTC)。未取得なら空
  last_fetched_at DATETIME NULL,
  -- 前回取得した最新の投稿ID。未取得なら空
  last_post_id VARCHAR(32) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 投稿(取得した投稿1件につき1行)
CREATE TABLE IF NOT EXISTS posts (
  -- 主キー(自動採番)
  id INT NOT NULL AUTO_INCREMENT,
  -- どのトピックの投稿か
  topic_id INT NOT NULL,
  -- Xの投稿ID(桁数が多いので、数値ではなく文字列で持つ)
  x_post_id VARCHAR(32) NOT NULL,
  -- 投稿者名
  author_name VARCHAR(100) NOT NULL,
  -- @ID(@なし)
  author_username VARCHAR(50) NOT NULL,
  -- アイコンURL(ない場合は空)
  author_icon_url VARCHAR(500) NULL,
  -- 本文
  text TEXT NOT NULL,
  -- 投稿日時(UTC)。並び順に使う
  posted_at DATETIME NOT NULL,
  -- 元投稿のURL
  post_url VARCHAR(500) NOT NULL,
  -- 取り込んだ日時(UTC)
  fetched_at DATETIME NOT NULL,
  -- お気に入りか(最初は、お気に入りではない)。お気に入りの投稿は、保存期間を過ぎても消さない
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id),
  -- 同じトピックに同じ投稿IDを2回入れられないようにする
  UNIQUE KEY uq_posts_topic_x_post (topic_id, x_post_id),
  -- topic_id には、topics に存在する id しか入れられないようにする
  CONSTRAINT fk_posts_topic FOREIGN KEY (topic_id) REFERENCES topics (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 画像(投稿1件につき0〜4行。画像は保存せず、URLだけを持つ)
CREATE TABLE IF NOT EXISTS media (
  -- 主キー(自動採番)
  id INT NOT NULL AUTO_INCREMENT,
  -- どの投稿の画像か
  post_id INT NOT NULL,
  -- 画像のURL
  url VARCHAR(500) NOT NULL,
  -- 並び順(1〜4)
  position INT NOT NULL,
  PRIMARY KEY (id),
  -- 同じ投稿に、同じ並び順の画像を2つ入れられないようにする
  UNIQUE KEY uq_media_post_position (post_id, position),
  -- post_id には posts に存在する id しか入れられない。投稿を消したら、その画像も一緒に消す
  CONSTRAINT fk_media_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
