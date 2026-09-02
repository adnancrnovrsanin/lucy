#!/usr/bin/env bash
set -euo pipefail

# Static checks for Lucy skill directories.
# Usage: scripts/check-skill.sh SKILL_DIR...
# Exit 0 when every directory passes, 1 otherwise, 2 on usage error.
#
# Checks per directory:
#   SKILL.md exists; frontmatter name equals the directory name; description
#   present; a model-invoked description is at most 300 characters;
#   agents/openai.yaml exists and allow_implicit_invocation: false appears
#   exactly when disable-model-invocation: true does; PROVENANCE.md exists
#   with a "## Tier" section; LICENSE exists unless PROVENANCE.md says
#   "Authored for Lucy"; no upstream residue outside LICENSE/PROVENANCE.md;
#   scripts/check-prose.sh passes on every .md except LICENSE.

REPO="$(cd "$(dirname "$0")/.." && pwd)"

if [ "$#" -eq 0 ]; then
  echo "usage: scripts/check-skill.sh SKILL_DIR..." >&2
  exit 2
fi

status=0
fail() {
  echo "FAIL $1: $2" >&2
  status=1
}

frontmatter() {
  # Print the frontmatter block (between the first two --- lines).
  awk 'NR==1 && $0!="---" {exit} NR>1 && $0=="---" {exit} NR>1 {print}' "$1"
}

for dir in "$@"; do
  dir="${dir%/}"
  name="$(basename "$dir")"
  skill="$dir/SKILL.md"
  if [ ! -f "$skill" ]; then
    fail "$name" "missing SKILL.md"
    continue
  fi
  fm="$(frontmatter "$skill")"
  fm_name="$(printf '%s\n' "$fm" | sed -n 's/^name: *//p' | head -1)"
  [ "$fm_name" = "$name" ] || fail "$name" "frontmatter name '$fm_name' does not equal the directory name"
  desc="$(printf '%s\n' "$fm" | sed -n 's/^description: *//p' | head -1)"
  desc="${desc#\"}"; desc="${desc%\"}"
  [ -n "$desc" ] || fail "$name" "missing description"
  user_invoked=0
  if printf '%s\n' "$fm" | grep -q '^disable-model-invocation: true'; then
    user_invoked=1
  fi
  if [ "$user_invoked" -eq 0 ] && [ "${#desc}" -gt 300 ]; then
    fail "$name" "model-invoked description is ${#desc} characters, limit 300"
  fi
  yaml="$dir/agents/openai.yaml"
  if [ ! -f "$yaml" ]; then
    fail "$name" "missing agents/openai.yaml"
  else
    if [ "$user_invoked" -eq 1 ]; then
      grep -q 'allow_implicit_invocation: false' "$yaml" || fail "$name" "user-invoked skill needs allow_implicit_invocation: false in openai.yaml"
    else
      if grep -q 'allow_implicit_invocation: false' "$yaml"; then
        fail "$name" "model-invoked skill must not set allow_implicit_invocation: false"
      fi
    fi
  fi
  prov="$dir/PROVENANCE.md"
  if [ ! -f "$prov" ]; then
    fail "$name" "missing PROVENANCE.md"
  else
    grep -q '^## Tier' "$prov" || fail "$name" "PROVENANCE.md has no '## Tier' section"
    if ! grep -q 'Authored for Lucy' "$prov" && [ ! -f "$dir/LICENSE" ]; then
      fail "$name" "vendored skill is missing LICENSE"
    fi
  fi
  residue="$(grep -r -n -E 'superpowers:|\.superpowers/|\.unlazy|setup-matt-pocock-skills|docs/agents/issue-tracker|your human partner' "$dir" 2>/dev/null | grep -v -E '/(LICENSE|PROVENANCE\.md):' || true)"
  if [ -n "$residue" ]; then
    fail "$name" "upstream residue:
$residue"
  fi
  prose_files="$(find "$dir" -name '*.md' -not -name 'LICENSE' -not -path '*/node_modules/*')"
  if [ -n "$prose_files" ]; then
    # shellcheck disable=SC2086
    if ! "$REPO/scripts/check-prose.sh" $prose_files; then
      fail "$name" "check-prose.sh reported hits (listed above)"
    fi
  fi
done

exit "$status"
