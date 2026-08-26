#!/usr/bin/env bash
set -euo pipefail

# Prints every skill as "<bucket>\t<name>\t<path>" across the three buckets.
# A skill is a directory directly under a bucket that contains SKILL.md.

REPO="$(cd "$(dirname "$0")/.." && pwd)"

for bucket in skills drafts deprecated; do
  dir="$REPO/$bucket"
  [ -d "$dir" ] || continue
  find "$dir" -mindepth 2 -maxdepth 2 -name SKILL.md | sort | while IFS= read -r f; do
    skill_dir="$(dirname "$f")"
    printf '%s\t%s\t%s\n' "$bucket" "$(basename "$skill_dir")" "${skill_dir#"$REPO"/}"
  done
done
