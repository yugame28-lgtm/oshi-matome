# 推しまとめ(oshi-matome)

推しのX投稿と、推しへのファンアートタグの投稿を、トピックごとに一覧表示する個人用Webサイト。
学習のアウトプットと就職用ポートフォリオを兼ねる。

## 技術スタック
| 役割 | 技術 | バージョン |
|---|---|---|
| フロントエンド | React(SPA) | 19系 |
| 開発ツール | Vite | 8系 |
| 言語 | JavaScript(TypeScriptは使わない) | ― |
| スタイル | 素のCSS(UIライブラリ・Tailwindは使わない) | ― |
| サーバー | Node.js | 24系(LTS) |
| APIフレームワーク | Express | 5系 |
| DB | MySQL(Windowsのサービスとして動かす。文字コード utf8mb4) | 9.7系(LTS) |
| DB接続 | mysql2(ORMは使わず、SQLを直接書く) | 3系 |
| 同時起動(開発用) | concurrently(直下の package.json) | 導入時の最新 |

## ディレクトリ構成
```
oshi-matome/
├── CLAUDE.md
├── package.json         画面とAPIを同時に起動するためだけのもの(concurrently)
├── docs/
│   ├── 01_requirements.md
│   ├── 02_design.md
│   ├── 03_phases.md
│   └── steps/           フェーズごとの手順書(作業の記録)
├── client/              React＋Vite
│   └── src/
│       ├── components/  画面部品(部品ごとにCSSファイルを置く)
│       └── api/         サーバーとの通信処理
└── server/              Node.js＋Express
    ├── routes/          APIの入口
    ├── db/              テーブル作成SQL・DB接続・SQLを書く処理
    ├── fetcher/         取得処理(sample用とX API用を差し替え可能)
    ├── sample/          X API v2の形式に合わせたサンプルデータ
    └── .env             DB接続情報・取得元・APIキー(Git管理外)
```

## 守るべき前提
- データ取得元はサンプルデータ。X APIへの切り替えは「あとで追加」。
- SQLは server/db/ の中だけに書く。
- .env はGitHubに上げない(.gitignoreに入れる)。
- サーバーの起動はPCのみ(localhost)。スマホからの利用は、ネット公開(ログイン付き)で行う予定(あとで追加)。Tailscaleは使わない。
- 現在の実装は docs/02_design.md の 1〜5。6 のうち 6-1〜6-5(取得のタイミングと対象、保存期間、お気に入りなど)はフェーズ5で実装済み。これから作るもの(ログイン、ネット公開)は 6-6・6-7。
- 画像は保存しない。XのURLを参照するだけ。
- DBはアプリ専用ユーザー(パスワードあり)で接続する。rootは使わない。

## 設計書
| ファイル | 内容 |
|---|---|
| docs/01_requirements.md | 目的・想定ユーザー・MVP範囲 |
| docs/02_design.md | 画面・データ・技術・API・入力チェック |
| docs/03_phases.md | 開発フェーズと完了条件 |

## 未決事項
- なし(各docsの未決事項を参照)

## 変更履歴
- 2026-10-03:初版作成
- 2026-10-03:DBをMySQL 8.4からXAMPP付属のMariaDB 10.4.32に変更
- 2026-10-06:DBをXAMPP付属のMariaDB 10.4.32からMySQL 9.7(LTS)に変更(フェーズ1完了後に切り替え)
- 2026-10-12:Tailscaleによるスマホ用起動を取りやめ。スマホからの利用は、ネット公開(ログイン付き)で行う方針に変更。これから作る変更の置き場所(docs/02_design.md の 6)を追記
- 2026-10-16:画面とAPIの起動を、直下の package.json(concurrently)で1回にまとめる。ディレクトリ構成と技術スタックに追記
- 2026-10-17:フェーズ5の完了にあわせ、設計書 6 の扱い(6-1〜6-5 は実装済み)を更新
