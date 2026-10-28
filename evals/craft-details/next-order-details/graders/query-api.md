---
type: regex
target: trace
# Code the agent wrote (a Write content or an Edit new_string) loads the order through queryClient.query or reads it with useSuspenseQuery or useQuery.
pattern: '"name":"(?:Write|Edit)","input":\{[^\n]*?"(?:content|new_string)":"(?:[^"\\\n]|\\.)*?(?:\.query\(|\buseSuspenseQuery\(|\buseQuery\()'
---
