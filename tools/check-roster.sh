#!/usr/bin/env bash
# team.json と、monica-ai-team プラグイン / ~/.claude/skills の実体がズレていないか照合する。
#
# 使い方:  ./tools/check-roster.sh
#
# 役割の文章はアプリ用に短く書き直してあるので自動生成はしない。
# このスクリプトが見るのは「人が増えた/減った」だけ。そこさえ揃っていれば
# 中身の更新漏れは目視で足りる。

set -euo pipefail
cd "$(dirname "$0")/.."

PLUGIN="${MONICA_AI_TEAM_DIR:-}"
if [ -z "$PLUGIN" ]; then
  PLUGIN=$(find "$HOME/Library/Application Support/Claude" \
             -type d -name monica-ai-team 2>/dev/null | head -1)
fi

if [ -z "$PLUGIN" ] || [ ! -d "$PLUGIN/skills" ]; then
  echo "プラグインが見つかりません。MONICA_AI_TEAM_DIR で場所を指定してください。"
  exit 1
fi

echo "プラグイン: $PLUGIN"
echo

# 個人スキル（~/.claude/skills）に移った人は、プラグインの古いコピーに残っていても数えない
user_ids=$(python3 -c '
import json
d = json.load(open("team.json"))
print("\n".join(sorted(p["id"] for p in d["people"] if p["status"] == "user")))')
skills=$(comm -23 <(ls "$PLUGIN/skills" | sort) <(printf '%s\n' "$user_ids"))
app=$(python3 -c '
import json
d = json.load(open("team.json"))
print("\n".join(sorted(
    p.get("skill", p["id"]) for p in d["people"] if p["status"] in ("staff", "ended")
)))')

# team.json の id とスキル名の対応（違うものだけ手で対応表に足す）
app=$(printf '%s\n' "$app" | sed \
  -e 's/^hope$/hope-chie/' \
  -e 's/^kappo$/kappo-honda/' \
  -e 's/^tanoshii$/tanoshii-project/' | sort)

only_plugin=$(comm -23 <(printf '%s\n' "$skills") <(printf '%s\n' "$app"))
only_app=$(comm -13 <(printf '%s\n' "$skills") <(printf '%s\n' "$app"))

status=0
if [ -n "$only_plugin" ]; then
  echo "アプリに載っていない社員:"; printf '  %s\n' $only_plugin; status=1
fi
if [ -n "$only_app" ]; then
  echo "プラグインに存在しない社員:"; printf '  %s\n' $only_app; status=1
fi

contract=$(python3 -c '
import json
d = json.load(open("team.json"))
print(" ".join(p["name"] for p in d["people"] if p["status"] == "contract"))')

if [ $status -eq 0 ]; then
  echo "社員 $(printf '%s\n' "$skills" | wc -l | tr -d " ")人 一致 ✓"
fi
echo "外注（プラグイン外）: ${contract:-なし}"
others=$(python3 -c '
import json
d = json.load(open("team.json"))
for st, label in (("user", "ユーザースキル"), ("ended", "終了")):
    names = " ".join(p["name"] for p in d["people"] if p["status"] == st)
    print(label + ": " + (names or "なし"))')
echo "$others"
for s in $(python3 -c 'import json;print(" ".join(p["id"] for p in json.load(open("team.json"))["people"] if p["status"]=="user"))'); do
  [ -f "$HOME/.claude/skills/$s/SKILL.md" ] || { echo "  ~/.claude/skills/$s が見つかりません"; status=1; }
done
exit $status
