---
name: resolve-conflicts
description: "Use when a git merge or rebase stops on conflicts: resolve each hunk by the intent of both sides, run the project's checks, and finish the operation; never abort."
---

1. **See the current state** of the merge or rebase. Check the git history and the conflicting files.

2. **Find the primary sources** for each conflict. Understand why each side made its change and what it intended. Read the commit messages, the PRs, and the original issues or tickets.

3. **Resolve each hunk.** Preserve both intents where possible. Where they are incompatible, pick the one matching the merge's stated goal and note the trade-off. Keep to the behaviour the two sides already wrote; invent nothing new. Always resolve; never `--abort`.

4. Discover the project's **automated checks** and run them, typically typecheck, then tests, then format. Fix anything the merge broke.

5. **Finish the merge or rebase.** Stage everything and commit. If rebasing, continue until every commit is rebased.
