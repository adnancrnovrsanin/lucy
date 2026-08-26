#!/usr/bin/env bash
set -euo pipefail

# Links every skill in skills/ and drafts/ into $HOME/.claude/skills/<name>
# as an absolute symlink into this repo, so a git pull keeps installed
# skills current. deprecated/ is never linked.
#
# Ownership rule: the script only creates, replaces, or removes symlinks
# whose raw target points into this repo. Any colliding entry it does not
# own is an error, and the error is raised before a single change is made.
# Dangling links it owns (source renamed, moved, or deprecated) are pruned.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/.claude/skills"

names=()
srcs=()

collect() {
  bucket_dir="$1"
  [ -d "$bucket_dir" ] || return 0
  for skill_dir in "$bucket_dir"/*/; do
    [ -d "$skill_dir" ] || continue
    skill_dir="${skill_dir%/}"
    if [ ! -f "$skill_dir/SKILL.md" ]; then
      echo "warn: skipping $skill_dir (no SKILL.md)" >&2
      continue
    fi
    names+=("$(basename "$skill_dir")")
    srcs+=("$skill_dir")
  done
}

collect "$REPO/skills"
collect "$REPO/drafts"

# Phase 1: verify every planned link before touching anything.
errors=0
i=0
while [ "$i" -lt "${#names[@]}" ]; do
  j=$((i + 1))
  while [ "$j" -lt "${#names[@]}" ]; do
    if [ "${names[$i]}" = "${names[$j]}" ]; then
      echo "error: duplicate skill name '${names[$i]}' (${srcs[$i]} and ${srcs[$j]})" >&2
      errors=1
    fi
    j=$((j + 1))
  done
  target="$DEST/${names[$i]}"
  if [ -e "$target" ] || [ -L "$target" ]; then
    if [ ! -L "$target" ]; then
      echo "error: $target exists and is not a symlink; refusing to touch it" >&2
      errors=1
    else
      case "$(readlink "$target")" in
        "$REPO"/*) : ;;
        *)
          echo "error: $target points to $(readlink "$target"), not into this repo; refusing to touch it" >&2
          errors=1
          ;;
      esac
    fi
  fi
  i=$((i + 1))
done

if [ "$errors" -ne 0 ]; then
  echo "aborting: nothing was changed" >&2
  exit 1
fi

# Phase 2: apply.
mkdir -p "$DEST"
i=0
while [ "$i" -lt "${#names[@]}" ]; do
  ln -sfn "${srcs[$i]}" "$DEST/${names[$i]}"
  echo "linked ${names[$i]} -> ${srcs[$i]}"
  i=$((i + 1))
done

# Phase 3: prune dangling links owned by this repo.
if [ -d "$DEST" ]; then
  for entry in "$DEST"/*; do
    [ -L "$entry" ] || continue
    case "$(readlink "$entry")" in
      "$REPO"/*)
        if [ ! -e "$entry" ]; then
          rm "$entry"
          echo "pruned dangling $(basename "$entry")"
        fi
        ;;
    esac
  done
fi
