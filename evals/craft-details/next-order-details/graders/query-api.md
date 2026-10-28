---
type: llm
focus: trace
---
PASS if any prefetch or loader uses queryClient.query, or the page uses useSuspenseQuery or useQuery with a shared queryOptions, and no prefetchQuery or ensureQueryData appears in any file the agent wrote. FAIL otherwise, naming the first miss.
