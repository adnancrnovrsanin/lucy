---
type: regex
target: trace
# One file the agent wrote maps a 404 to notFound(), in the page or the data function it calls.
pattern: '"name":"(?:Write|Edit)","input":\{[^\n]*?"(?:content|new_string)":"(?:(?:[^"\\\n]|\\.)*?\b404\b(?:[^"\\\n]|\\.)*?\bnotFound\(\)|(?:[^"\\\n]|\\.)*?\bnotFound\(\)(?:[^"\\\n]|\\.)*?\b404\b)'
---
