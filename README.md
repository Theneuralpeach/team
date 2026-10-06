# AI チーム

Monica の AI チーム 19人を携帯から引くための PWA。内訳はプラグイン12人＋個人スキル7人（Leo / Juno / Kai / Mia / Vera / Cal / Rui）。終了したクライアント（Eyelinq、Tanoshii Project）は「終了」バッジを付けて一番下に置いている。

https://theneuralpeach.github.io/team/

## できること

- グループで絞り込み（全員 / 経営・運営 / 制作 / 品質・心理 / クライアント）
- 名前・役割・やりたいことで検索（「英語」で Cal、「請求書」で Sunny）
- カードをタップして詳細 →「○○を召喚して」をワンタップでコピー
- 「誰に頼む？」で 2 問答えると担当者が出る

端末内で完結。外部通信もログインもなし。オフラインで開く。

## データ

`team.json` が唯一のデータ。役割の文章はアプリ用に短く書き直してあるので自動生成はしない。

正本は monica-ai-team プラグインの `skills/*/SKILL.md`。
人が増減した時のズレは照合スクリプトで検出する。

```
./tools/check-roster.sh
```

社員が一致していれば `一致 ✓` が出る。個人スキル（`status: user`）はプラグインの照合から外し、
`~/.claude/skills/<id>/SKILL.md` があるかだけ見る。

`status` の種類: `staff`（プラグイン社員）/ `contract`（仮採用の外注。今は0人）/ `user`（`~/.claude/skills/` にある人格。Leo・Juno・Kai・Mia・Vera・Cal・Rui）/ `ended`（終了したクライアント。灰色表示・振り分けから除外）。

## 更新の手順

1. `team.json` を編集
2. `index.html` と `sw.js` の `?v=` を上げる
3. `sw.js` の `CACHE` を上げる（上げないと古いまま残る）
4. commit → push

## 構成

```
index.html      画面
styles.css      見た目
app.js          一覧・検索・絞り込み・コピー・振り分け
team.json       データ（19人＋振り分けの分岐）
sw.js           オフライン用（ネット優先・落ちたらキャッシュ）
manifest.json   ホーム画面インストール用
tools/          正本との照合スクリプト
```

## スキルタブ（2ページ目）

上の「スキル」タブで、Monica のスキル93個をカテゴリで絞り込み・検索できる。
カードをタップすると「何をするスキルか・起動の一言」が出て、起動フレーズ（/business-finder 等）をコピーできる。
自動で発火するだけのスキル（デザインの床など）はコピーボタンを出さない。

- `個人` バッジ = ~/.claude/skills/ にある自分用のスキル。どこでも使える
- `プラグイン` バッジ = プラグイン経由。どこでも使える
- `Obsidian` バッジ = Obsidian作業のときに使う（Vault の `skills/`）
- `終了` バッジ = 終了したクライアント用のスキル。灰色で表示

データは `skills.json`。SKILL.md の description から起こしているが、Monica 向けに短く書き直してあるので手動更新。
実体との照合は `tools/check-skills.sh`（人数ならぬスキル数のズレを検出）。

## フレームタブ（3ページ目）

「スキルじゃないけど呼び出せる」言葉と思考の型14個。
動画や投稿を渡す時の4語（完コピ / 型パクり / 学習 / 実践）が先頭で、そのあとに
ELI5 / Pre-mortem / Steelman / Red team / First principles / table / V2 / /brainstorm / /checklist / /proofread が続く。
タップするとプロンプトの型が出て、そのままコピーできる。データは `frames.json`。

4語の使い分け（2026-10-05 決定）:

| 言葉 | 意味 | 出てくるもの |
|---|---|---|
| 完コピ | 動画そのものを同じに作る | 動画 |
| 型パクり | 構成・動き・見せ方だけ借りて、中身は差し替える | 別内容の動画 |
| 学習 | フォント・理論・手法をClaudeに覚えさせる | wiki やスキルへの記録のみ |
| 実践 | 動画の中身を Monica 自身がやる | 手順書とやることリスト |

## Mac タブ（4ページ目）

Finder のショートカットと、エイリアス・タグの使い方12個（⌘R / オリジナルを表示 / ⌘I / 赤タグ / 赤タグの一覧 / タグで探す / control + 1 / ⌘L / ⌥⌘P / ⌘↑ / パス名をコピー / スペース）。
タップすると「やり方」が手順で出る。データは `shortcuts.json`（`steps` に手順を1行ずつ）。追加するときは `items` に1件足して、`sw.js` の `CACHE` と `?v=` を上げる。

## スキルは87個に拡張

初版の58個（user + Obsidian）に、anthropic-skills プラグインの Monica 専用スキル29個を追加。
所在バッジ: `個人`（~/.claude/skills）/ `Obsidian`（vault）/ `プラグイン`（anthropic-skills）。2026-10-05 に、掲載漏れだった6個（film-grade / ai-video-remake / project-recall / monica-auto-capability-router / obsidian-cli / medium-delta-miner）を足して93個。
汎用スキル（docx/pdf/xlsx/frontend-design 等13個）は意図的に非掲載。`tools/check-skills.sh` で確認できる。
