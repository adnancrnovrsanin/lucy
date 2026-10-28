---
type: regex
target: trace
# A row the agent wrote combines its label and value in one accessible element: accessible and accessibilityLabel on the same tag.
pattern: '"name":"(?:Write|Edit)","input":\{[^\n]*?"(?:content|new_string)":"(?:[^"\\\n]|\\.)*?(?:\baccessible(?![A-Za-z])(?:[^"\\\n<>]|\\.){0,300}?\baccessibilityLabel=|\baccessibilityLabel=(?:[^"\\\n<>]|\\.){0,300}?\baccessible(?![A-Za-z]))'
---
