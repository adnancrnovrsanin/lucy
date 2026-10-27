#!/usr/bin/env bash
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cp -R "$here/fixture/." .
git init -q -b main
git add -A
git -c user.email=eval@example.com -c user.name=eval commit -q -m "base project"
cp -R "$here/seed/." .
