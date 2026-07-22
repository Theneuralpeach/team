#!/usr/bin/env bash
# skills.json が実際のインストール済みスキルとズレていないか照合する。
#   ./tools/check-skills.sh
# 説明文はアプリ用に短く書き直してあるので中身は照合しない。増減だけ見る。

set -euo pipefail
cd "$(dirname "$0")/.."

real=$(
  { ls "$HOME/.claude/skills" 2>/dev/null
    ls "$HOME/Documents/Obsidian-AI/skills" 2>/dev/null
  } | sort -u
)
app=$(python3 -c '
import json
print("\n".join(sorted(s["slug"] for s in json.load(open("skills.json"))["skills"])))')

only_real=$(comm -23 <(printf '%s\n' "$real") <(printf '%s\n' "$app"))
only_app=$(comm -13 <(printf '%s\n' "$real") <(printf '%s\n' "$app"))

status=0
if [ -n "$only_real" ]; then
  echo "アプリに未掲載のスキル:"; printf '  %s\n' $only_real; status=1
fi
if [ -n "$only_app" ]; then
  echo "実体に存在しないスキル:"; printf '  %s\n' $only_app; status=1
fi
if [ $status -eq 0 ]; then
  echo "スキル $(printf '%s\n' "$real" | wc -l | tr -d ' ')個 一致 ✓"
fi
exit $status
