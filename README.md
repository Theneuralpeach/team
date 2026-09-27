# AI チーム

Monica の AI チーム 19人を携帯から引くための PWA。内訳はプラグイン社員14＋外注3（Vera / Cal / Rui）＋ユーザースキル2（Leo / Juno）。Eyelinq は 2026年8月で終了したので「終了」バッジを付けて一番下に置いている。

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

社員が一致していれば `一致 ✓` が出る。外注3人（Vera / Cal / Rui）はプラグイン外なので
照合対象から外してある。常設化したらスキル化して `status` を `staff` に変える。

`status` の種類: `staff`（プラグイン社員）/ `contract`（外注）/ `user`（`~/.claude/skills/` にある人格。Leo・Juno）/ `ended`（終了したクライアント。灰色表示・振り分けから除外）。

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

上の「スキル」タブで、Monica のスキル58個（user 28＋Obsidian 30）をカテゴリで絞り込み・検索できる。
カードをタップすると「何をするスキルか・起動の一言」が出て、起動フレーズ（/business-finder 等）をコピーできる。
自動で発火するだけのスキル（デザインの床など）はコピーボタンを出さない。

- `Code` バッジ = ~/.claude/skills/ にあり Claude Code で常に使える
- `Obsidian` バッジ = Obsidian作業（claude-obsidian）で使える

データは `skills.json`。SKILL.md の description から起こしているが、Monica 向けに短く書き直してあるので手動更新。
実体との照合は `tools/check-skills.sh`（人数ならぬスキル数のズレを検出）。

## フレームタブ（3ページ目）

「スキルじゃないけど呼び出せる」思考の型10個（ELI5 / Pre-mortem / Steelman / Red team /
First principles / table / V2 / /brainstorm / /checklist / /proofread）。
タップするとプロンプトの型が出て、そのままコピーできる。データは `frames.json`。

## スキルは87個に拡張

初版の58個（user + Obsidian）に、anthropic-skills プラグインの Monica 専用スキル29個を追加。
所在バッジ: `Code`（~/.claude/skills）/ `Obsidian`（vault）/ `Plugin`（anthropic-skills）。
汎用スキル（docx/pdf/xlsx/frontend-design 等13個）は意図的に非掲載。`tools/check-skills.sh` で確認できる。
