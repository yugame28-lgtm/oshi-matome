-- このファイルの文字コードを utf8mb4 として読ませる(日本語の文字化けを防ぐ)
SET NAMES utf8mb4;

-- 操作の対象にするDBを選ぶ
USE oshi_matome;

-- トピックの初期データ(2行)。実行するのは1回だけ
INSERT INTO topics (id, name, query_type, query_value) VALUES
  (1, '推しの投稿', 'user', 'oshi_id'),
  (2, 'ファンアート', 'hashtag', 'oshiArt');
