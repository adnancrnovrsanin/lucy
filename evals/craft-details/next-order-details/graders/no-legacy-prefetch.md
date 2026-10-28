---
type: regex
target: trace
# No code the agent wrote uses the pre-5.105 prefetchQuery or ensureQueryData.
pattern: '"name":"(?:Write|Edit)","input":\{[^\n]*?"(?:content|new_string)":"(?:[^"\\\n]|\\.)*?\b(?:prefetchQuery|ensureQueryData)\b'
match: not_contains
---
