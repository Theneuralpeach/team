#!/usr/bin/env bash
# skills.json が実際のインストール済みスキルとズレていないか照合する。
#   ./tools/check-skills.sh
# 3ソース: user(~/.claude/skills) / obsidian(vault/skills) / plugin(anthropic-skills)
# 説明はアプリ用に短縮してあるので中身は照合しない。増減だけ見る。
set -euo pipefail
cd "$(dirname "$0")/.."

# プラグインの skills は複数セッション配下にあり得るので全部合算する
plugin_skills=$(find "$HOME/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin" \
  -maxdepth 4 -type d -name skills 2>/dev/null \
  -exec sh -c 'ls "$1"' _ {} \; 2>/dev/null)

real=$(
  { ls "$HOME/.claude/skills" 2>/dev/null
    ls "$HOME/Documents/Obsidian-AI/skills" 2>/dev/null
    printf '%s\n' "$plugin_skills"
  } | grep -v '^$' | sort -u)

app=$(python3 -c '
import json
print("\n".join(sorted(s["slug"] for s in json.load(open("skills.json"))["skills"])))')

# アプリは Monica 専用に絞ってある。プラグインの汎用スキルは意図的に非掲載。
only_app=$(comm -13 <(printf "%s\n" "$real") <(printf "%s\n" "$app"))
missing=$(comm -23 <(printf "%s\n" "$real") <(printf "%s\n" "$app"))

status=0
if [ -n "$only_app" ]; then
  echo "実体に存在しないのに載せてるスキル:"; printf '  %s\n' $only_app; status=1
fi
echo "掲載 $(printf '%s\n' "$app" | wc -l | tr -d ' ')個 / 実体 $(printf '%s\n' "$real" | wc -l | tr -d ' ')個"
echo "非掲載（汎用など・意図的に除外）:"; printf '  %s\n' $missing | head -30
exit $status
