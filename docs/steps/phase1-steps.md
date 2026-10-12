# フェーズ1 手順書:MVP(推しの投稿を縦に通す)

- もとにした設計書:docs/03_phases.md「フェーズ1」
- 順序の変更:設計書の並び(土台 → DB → 取り込み → API → 画面)を、フロントエンド先行に変更(2026-10-03 承認済み)。
  - 理由:画面をダミーデータで先に動かし、DBの準備で画面作りが止まらないようにするため。
- DBの変遷:2026-10-03 に MySQL 8.4 から XAMPP付属の MariaDB 10.4.32 に変更し、セクション7〜13は MariaDB で作成した。2026-10-05〜06 に MySQL 9.7(LTS)へ切り替えた(セクション14〜17)。セクション8〜11の XAMPP・MariaDB に関する記述は、作成当時の記録として残している。
  - 切り替えの理由:XAMPP Control Panel の「Stop」が強制終了になり、MariaDB の管理用テーブルが壊れて、専用ユーザーの権限が消えたため(2026-10-04 に2回)。
- 今のDB:MySQL 9.7.2。Windows のサービス `MySQL97` として、PC の起動時に自動で動く。
  - 止め方:手で止めなくてよい。PC のシャットダウンで正常終了する。タスクマネージャーで `mysqld` を終了しない。
  - mysql コマンド:`C:\Program Files\MySQL\MySQL Server 9.7\bin\mysql.exe` をフルパスで実行する。root はパスワードあり(`-p`)。
  - SQLファイルを `source` で実行するときは、ログイン時に `--commands` を付け、ファイルは `C:/oshi-matome/...` とフルパスで指定する。
  - XAMPP の MySQL は使わない(同じポート 3306 を使うため、起動しても失敗する)。
- フェーズ1の範囲外:タブ、画像、media テーブル、「もっと見る」、状態表示、入力チェック、ヘッダー(フェーズ2以降)。

---
# フロントエンド

## 1. client の土台  [x]
- 目的:React + Vite の開発環境を作り、ブラウザで初期画面を開けるようにする。
- ファイルと置き場所:`client/`(Vite のテンプレートで作成)。不要な初期ファイル(サンプルのロゴ、初期スタイル、初期の App の中身)を整理する。
- 仕様:React 19系、Vite 8系、JavaScript(TypeScriptは使わない)。client は自分の package.json を持つ。
- 確認:あり(開発サーバーを起動し、ブラウザで画面が開く)

## 2. ダミーデータ  [x]
- 目的:サーバーがなくても画面を作れるよう、API 3 が返す形と同じ固定データを用意する。
- ファイルと置き場所:`client/src/api/dummyPosts.js`(新規)
- 仕様:
  - 項目は id、author_name、author_username、author_icon_url、text、posted_at、post_url(設計書 4-1 の API 3。media はフェーズ2で追加)。
  - 5件程度。新しい順に並べておく(並べ替えはサーバーの役割のため)。
  - 改行を含む本文、絵文字を含む本文、アイコンURLなしの投稿を混ぜる。
  - posted_at は UTC の日時文字列。
- 確認:なし(次の確認はセクション5で、ブラウザにカード一覧が出たとき)

## 3. PostCard(カード1枚)  [x]
- 目的:投稿1件をカードとして表示する。
- ファイルと置き場所:`client/src/components/PostCard.jsx`(新規)、`client/src/components/PostCard.css`(新規)
- 仕様(設計書 1-4):
  - アイコン(なければ代替表示)、投稿者名、@ID(先頭に@を付ける)。
  - 投稿日時は「年/月/日 時:分」。日本時間に変換して表示する。
  - 本文は改行を保持する。
  - 「Xで見る」は post_url を新しいタブで開く。
  - 画像は表示しない(フェーズ2)。
- 確認:なし(次の確認はセクション5で、ブラウザにカード一覧が出たとき)

## 4. PostList(カード一覧)  [x]
- 目的:投稿の一覧を受け取り、カードを縦に並べる。
- ファイルと置き場所:`client/src/components/PostList.jsx`(新規)、`client/src/components/PostList.css`(新規)
- 仕様:
  - 受け取った順のまま PostCard を並べる。
  - 「もっと見る」と状態表示(読み込み中・0件・エラー)は入れない(フェーズ2)。
- 確認:なし(次の確認はセクション5で、ブラウザにカード一覧が出たとき)

## 5. App で組み立て + 全体用CSS  [x]
- 目的:ダミーデータを PostList に渡し、画面にカード一覧を表示する。
- ファイルと置き場所:`client/src/App.jsx`(編集)、`client/src/index.css`(編集:全体用CSS)
- 仕様:
  - 共通の色・フォント・余白は全体用CSSにまとめ、部品のCSSはそれを使う(設計書 1-8)。
  - 配色・フォント・余白は未決のため、最低限の仮の値にする(フェーズ2で決め直す)。
  - PCでは中央寄せの1列で、横幅に上限を設ける。
- 確認:あり(ブラウザでダミーの投稿がカード表示され、「Xで見る」が新しいタブで開く)

---
# バックエンド

## 6. server の土台  [x]
- 目的:Express のサーバーを起動できるようにする。
- ファイルと置き場所:`server/package.json`(新規)、`server/index.js`(新規)
- 仕様:
  - Node.js 24系、Express 5系。server は自分の package.json を持つ。
  - 待ち受けは PC のみ(localhost)。ポートは 3000。
- 確認:あり(サーバーを起動し、起動メッセージが出る)

## 7. .env・見本ファイル・.gitignore  [x]
- 目的:DB接続情報などの設定を、Git に上げない形で用意する。
- ファイルと置き場所:`.gitignore`(新規)、`server/.env.example`(新規:項目名だけの見本)、`server/.env`(新規)、`server/package.json`(編集:起動時に .env を読み込む)
- 仕様(設計書 3-6):
  - 項目:DB接続情報(ホスト・ポート・ユーザー・パスワード・DB名)、取得元(sample)、取得間隔(6)。
  - 項目名:DB_HOST、DB_PORT、DB_USER、DB_PASSWORD、DB_NAME、FETCH_SOURCE、FETCH_INTERVAL_HOURS。
  - DBのユーザーはアプリ専用ユーザーにする(root は使わない)。ユーザー自体はセクション8で作る。
  - .env の読み込みは Node.js 標準の機能を使う(追加ライブラリなし)。
  - .gitignore に .env と node_modules を入れる。
  - 必須項目がそろっているかのチェックは入れない(フェーズ3)。
- 確認:あり(.env を読み込む設定のまま、サーバーが起動する。値が正しいかはセクション9でDBに接続して確認する)

## 8. テーブル作成SQLと初期データ  [x]
- 目的:MariaDB(XAMPP)にDBとアプリ専用ユーザーを作り、topics・posts テーブルを作って、topics に2行を登録する。
- ファイルと置き場所:`server/db/schema.sql`(新規)、`server/db/seed.sql`(新規)
- 仕様(設計書 2-1〜2-3):
  - MariaDB 10.4.32(XAMPP付属)を使う。XAMPP Control Panel で MySQL を起動し、`C:\xampp\mysql\bin` の mysql コマンドで操作する。
  - 文字コードは utf8mb4。XAMPPの初期設定に頼らず、DB作成時とテーブル作成時に明示的に指定する。
  - アプリ専用ユーザー(このDBだけを操作できる権限、パスワードあり)を作る。パスワードを含むため、ユーザー作成のSQLはファイルに残さず手で実行する。
  - MariaDB固有の機能は使わず、MySQLと共通の書き方にとどめる。
  - 日時は UTC で保存する。
  - topics:id、name、query_type、query_value、last_fetched_at、last_post_id。
  - posts:id(自動採番)、topic_id、x_post_id、author_name、author_username、author_icon_url、text、posted_at、post_url、fetched_at。
  - posts は topic_id と x_post_id の組み合わせで重複禁止。topic_id は topics.id を参照。
  - 初期データ:「推しの投稿」(user)と「ファンアート」(hashtag)の2行。
  - media テーブルは作らない(フェーズ2)。
- 確認:あり(mysql コマンドでテーブルと topics の2行を表示し、専用ユーザーでログインできる)

## 9. DB接続  [x]
- 目的:サーバーから MariaDB に接続できるようにする。
- ファイルと置き場所:`server/db/connection.js`(新規)、`server/index.js`(編集:起動時に接続を確かめる)
- 仕様:
  - mysql2(3系)を使う。接続情報は .env から読み、アプリ専用ユーザーで接続する(root は使わない)。
  - 文字コードは utf8mb4、日時は UTC としてやり取りする。
  - 起動時に topics の件数を数えるSQLを1回実行し、結果をターミナルに表示する。失敗した場合は原因を表示する(サーバーは止めない)。
- 確認:あり(サーバー起動時に「DBに接続しました(topics: 2件)」と表示される)

## 10. サンプルデータ(推しの投稿)  [x]
- 目的:X API v2 の返却形式に合わせた「推しの投稿」のサンプルを用意する。
- ファイルと置き場所:`server/sample/oshi-posts.json`(新規。データなので、書き写しではなくコピー&貼り付けでよい)
- 仕様(設計書 3-4):
  - 投稿本体の一覧、ユーザー情報の一覧、画像情報の一覧、メタ情報(newest_id)に分ける。
  - 20件超。画像0枚・1枚・2枚・4枚の投稿、絵文字を含む投稿を混ぜる。
  - 画像URLはダミー画像サービス等のURLを使う。
  - 「追加分」のサンプルとファンアートのサンプルは作らない(フェーズ2・3)。
- 確認:なし(次の確認はセクション11で、posts に取り込めたとき)

## 11. 取り込みスクリプト(手動実行)  [x]
- 目的:サンプルデータを posts に取り込む。
- ファイルと置き場所:`server/db/posts.js`(新規:posts のSQLを書く処理)、`server/db/importSample.js`(新規:手動で実行するスクリプト)、`server/package.json`(編集:実行用の呼び名 `import:sample` を足す)
- 仕様:
  - 投稿本体とユーザー情報を author_id で突き合わせ、posts の形に組み立てる(設計書 3-3)。
  - post_url は @ID と投稿ID から組み立てる。
  - 同じトピックに同じ投稿IDがあれば保存しない(エラーにしない)。
  - 画像は取り込まない(フェーズ2)。
  - SQLは server/db/ の中だけに書く。
- 確認:あり(スクリプトを実行し、mysql コマンドで posts の件数と中身を表示する)

## 12. API 3(投稿一覧)  [x]
- 目的:トピックの投稿一覧を返すAPIを作る。
- ファイルと置き場所:`server/routes/posts.js`(新規)、`server/db/posts.js`(編集:一覧取得のSQLを追加)、`server/index.js`(編集:ルートを登録)
- 仕様(設計書 4-1〜4-2):
  - GET /api/topics/:topicId/posts
  - 20件固定。posted_at の新しい順、同じ日時なら id の大きい順。
  - レスポンス:posts(id、author_name、author_username、author_icon_url、text、posted_at、post_url)。
  - offset、has_more、media は入れない(フェーズ2)。入力チェックは入れない(フェーズ3)。
  - DBのエラー時は 500 と error を返す(設計書 4-4)。
- 確認:あり(ブラウザでAPIのURLを直接開き、投稿の一覧が返る)

## 13. 仮→本物:ダミーデータをAPI通信に差し替え  [x]
- 目的:画面の表示元を、ダミーデータから API 3 に切り替える。
- ファイルと置き場所:`client/src/api/posts.js`(新規:API 3 を呼ぶ処理)、`client/vite.config.js`(編集:プロキシ)、`client/src/App.jsx`(編集)
- 仕様:
  - 仮→本物:`dummyPosts.js` の読み込みをやめ、API 3 から取得した投稿を表示する。
  - 画面からAPIへの通信は Vite の中継(プロキシ)を通す(設計書 3-5)。
  - トピックは「推しの投稿」固定(タブはフェーズ2)。
- 確認:あり(フェーズ1の完了条件)
  - PCのブラウザで、サンプルの推しの投稿が新しい順にカード表示される。
  - 「Xで見る」で元投稿のURLが新しいタブで開く。

---
# フェーズ1完了後:DBの切り替え(MariaDB → MySQL)

セクション13までが終わり、フェーズ1の完了条件を満たしてから着手する(2026-10-04 決定)。

## 14. MySQL のインストール  [x]
- 目的:PCに MySQL を導入し、正常に起動・終了できる状態にする。
- ファイルと置き場所:なし(PCへの導入。プロジェクトのファイルは変更しない)
- 仕様:
  - MySQL の最新のLTSを、公式のインストーラーで入れる。バージョンは着手時に公式の配布情報で確認する。
  - 2026-10-05 に確認:最新のLTSは 9.7系(配布中は 9.7.2 LTS)。Windows (x86, 64-bit) の MSI Installer を使う。8.4系は1つ前のLTS、26.7.0 は Innovation(LTSではない)。
  - 設定は MySQL Configurator で行う。Windows ファイアウォールのポートは開けない(PCの中からだけ使うため)。
  - Windows のサービスとして登録する(停止やPCのシャットダウンで正常終了させるため)。
  - root にパスワードを設定する。
  - ポートは 3306。XAMPP の MariaDB と同時には動かさない(同じポートを使うため)。
  - XAMPP 側の lesson などの学習用DBは、XAMPP に残す(移すかどうかは着手時に決める)。
- 確認:あり(バージョンが表示され、サービスの起動と停止ができる)

## 15. DB・テーブル・専用ユーザーの作り直し  [x]
- 目的:MySQL 側に、oshi_matome のDB・テーブル・初期データ・アプリ専用ユーザーを作る。
- ファイルと置き場所:`server/db/schema.sql`、`server/db/seed.sql`(そのまま使う見込み。MySQL で動かない書き方があれば、着手時に直す)、`server/.env`(接続情報が変わる場合のみ編集)
- 仕様:
  - schema.sql と seed.sql を MySQL で実行する。
  - アプリ専用ユーザー(このDBだけを操作できる権限、パスワードあり)を作る。パスワードを含むSQLはファイルに残さない。
  - 文字コードは utf8mb4、日時は UTC で保存する(設計書 2-1 のまま)。
- 確認:あり(テーブルと topics の2行を表示し、専用ユーザーでログインできる)

## 16. 接続と取り込みの確認  [x]
- 目的:アプリが MySQL で、フェーズ1と同じように動くことを確かめる。
- ファイルと置き場所:変更なしの見込み(`server/db/connection.js` は .env を読むだけのため)
- 仕様:
  - サーバー起動時のDB接続、サンプルデータの取り込み、API 3、画面の表示を順に確かめる。
  - MySQL を停止して起動し直しても、専用ユーザーの権限が残ることを確かめる。
- 確認:あり(MySQL に接続した状態で、フェーズ1の完了条件を満たす)

## 17. 設計書・手順書への反映  [x]
- 目的:DBの記述を、実際に使っている MySQL に合わせる。
- ファイルと置き場所:`CLAUDE.md`、`docs/02_design.md`、`docs/03_phases.md`(DBの種類とバージョン、変更履歴)、`docs/steps/phase1-steps.md`(冒頭の MariaDB の止め方の記述)
- 仕様:セクション14で入れたバージョンを書く。MariaDB 固有の注意書き(止め方、root の扱いなど)を、MySQL に合わせて見直す。
- 確認:なし(フェーズ2の手順書を作るときに、設計書の記述と合っているかを見る)
