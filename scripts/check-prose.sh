#!/usr/bin/env bash
set -euo pipefail

# Prints every line that contains an em dash, en dash, or curly quote and
# exits 1; exits 0 when every given file is clean.
# Usage: scripts/check-prose.sh FILE...

if [ "$#" -eq 0 ]; then
  echo "usage: scripts/check-prose.sh FILE..." >&2
  exit 2
fi

hits="$(perl -CSD -ne 'print "$ARGV:$.: $_" if /[\x{2014}\x{2013}\x{201C}\x{201D}\x{2018}\x{2019}]/; close ARGV if eof' "$@")"
if [ -n "$hits" ]; then
  printf '%s\n' "$hits"
  exit 1
fi
exit 0
