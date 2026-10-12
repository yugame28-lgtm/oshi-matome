# 推しまとめ(oshi-matome)

推しの X の投稿と、推しへのファンアートタグの投稿を、トピックごとのタブで一覧表示する、個人用の Web サイトです。
学習のアウトプットと、ポートフォリオを兼ねて作りました。

## できること

- 「推しの投稿」と「ファンアート」を、タブで切り替えて表示する
- 投稿をカードで表示する(アイコン、投稿者名、@ID、投稿日時、本文、画像、「Xで見る」リンク)
- 画像を、枚数(0〜4枚)に応じた並べ方で表示する
- 新しい順に20件ずつ表示し、「もっと見る」で続きを読み込む
- サイトを開いたときに、前回より新しい投稿だけを取得して保存する(差分取得)
- 読み込み中、0件、取得の失敗、読み込みの失敗を、それぞれ表示する
- スマホの幅でも、崩れずに表示する

## 技術

| 役割 | 技術 |
|---|---|
| フロントエンド | React 19(JavaScript)、Vite 8、素の CSS |
| サーバー | Node.js 24、Express 5 |
| データベース | MySQL 9.7 |
| DB 接続 | mysql2(ORM は使わず、SQL を直接書く) |

## 仕組み

```
ブラウザ(React)
   │  API 1:トピックの一覧
   │  API 2:新しい投稿の取得(差分だけ)
   │  API 3:投稿の一覧(20件ずつ)
   ▼
Express ──→ MySQL(topics、posts、media)
   │
   └─ fetcher(取得処理)── サンプルデータ(X API v2 の形式)
                           ※ X API 用は、あとで追加
```

## 設計で考えたこと

- **X API に切り替えやすい作りにする**
  サンプルデータを X API v2 の返却形式に合わせ、取得処理(fetcher)を `.env` の設定で切り替えられるようにしました。切り替えるときに新しく作るのは、X に問い合わせる部分だけです。
- **読み取りの件数を最小にする**
  X API は従量課金のため、前回取得した最新の投稿より新しいものだけを取得し(差分取得)、同じ投稿を二度保存しないようにしています。
- **SQL を1か所にまとめる**
  SQL は `server/db/` の中だけに書き、API の入口(`server/routes/`)と分けています。開発の途中で DB を MariaDB から MySQL に切り替えましたが、アプリのコードは変えずに済みました。
- **おかしな入力を、入口で断る**
  不正なトピック番号や件数の指定には 400 / 404 を返し、項目の欠けた投稿は保存せずにログへ記録します。`.env` の必須項目が足りないときは、サーバーを起動しません。
- **秘密の情報を、コードと分ける**
  DB の接続情報は `.env` に置き、Git の管理から外しています。アプリは、対象の DB の読み書きだけができる専用のユーザーで接続します。
- **仮のデータで先に画面を作る**
  画面を仮のデータで動かしてから、本物の API に差し替える順番で進めました。API が返すべき形を、先に画面の側から確かめるためです。

## 動かし方

Node.js 24 と MySQL 9.7 が入っていることを前提にしています。

### 1. コードを取得する

```
git clone https://github.com/ユーザー名/oshi-matome.git
cd oshi-matome
```

### 2. データベースを用意する

MySQL に root でログインし、テーブルと初期データを作ります(`source` を使うため、`--commands` を付けます)。

```
mysql -u root -p --default-character-set=utf8mb4 --commands
```

```sql
source server/db/schema.sql
source server/db/seed.sql

-- アプリ専用のユーザーを作り、この DB の読み書きだけを許可する(パスワードは自分で決める)
CREATE USER 'oshi_app'@'localhost' IDENTIFIED BY 'ここにパスワード';
GRANT SELECT, INSERT, UPDATE, DELETE ON oshi_matome.* TO 'oshi_app'@'localhost';
```

### 3. 設定ファイルを作る

`server/.env.example` をコピーして `server/.env` という名前にし、値を入れます。

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=oshi_app
DB_PASSWORD=手順2で決めたパスワード
DB_NAME=oshi_matome
FETCH_SOURCE=sample
FETCH_INTERVAL_HOURS=6
```

### 4. 起動する

サーバーと画面を、別々のターミナルで起動します。

```
cd server
npm install
npm start
```

```
cd client
npm install
npm run dev
```

ブラウザで `http://localhost:5173/` を開きます。最初に開いたときに、サンプルデータが取り込まれて表示されます。

## ディレクトリ構成

```
oshi-matome/
├── client/              画面(React + Vite)
│   └── src/
│       ├── components/  画面の部品(部品ごとに CSS を置く)
│       └── api/         サーバーとの通信
├── server/              API(Node.js + Express)
│   ├── routes/          API の入口
│   ├── db/              テーブル作成 SQL、DB 接続、SQL を書く処理
│   ├── fetcher/         取得処理(取得元を切り替えられる)
│   └── sample/          X API v2 の形式に合わせたサンプルデータ
└── docs/                設計書と、作業の記録
```

## 設計書

| ファイル | 内容 |
|---|---|
| [docs/01_requirements.md](docs/01_requirements.md) | 目的、想定ユーザー、機能の仕分け |
| [docs/02_design.md](docs/02_design.md) | 画面、データ、技術、API、入力チェック。これから作るものの設計 |
| [docs/03_phases.md](docs/03_phases.md) | 開発フェーズと完了条件 |
| [docs/steps/](docs/steps/) | フェーズごとの手順書(作業の記録) |

## 開発の進め方

学習(アウトプット)を目的とし、設計書を先に作り、フェーズごとの手順書に沿って、1つずつ作りました。
AI(Claude)を伴走役として使い、提示されたコードを自分で書き写しながら、分からない点を質問して理解する形で進めて行きました。AI への指示は [CLAUDE.md](CLAUDE.md) に、やり取りの中で決めたことは [docs/steps/](docs/steps/) に残しています。
