---
type: regex
target: trace
# Section titles the agent wrote use Typography.Heading or the header accessibility role.
pattern: '"name":"(?:Write|Edit)","input":\{[^\n]*?"(?:content|new_string)":"(?:[^"\\\n]|\\.)*?(?:<Typography\.Heading\b|accessibilityRole=\\"header\\")'
---
