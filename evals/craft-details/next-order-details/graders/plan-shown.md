---
type: regex
target: trace
pattern: '^(?:(?!"name":"(?:Write|Edit)")[\s\S])*?\{"type":"assistant"[^\n]*?"type":"text","text":"(?=(?:[^"\\\n]|\\.)*?\btotalCents\b)(?=(?:[^"\\\n]|\\.)*?\bmoney\b)(?=(?:[^"\\\n]|\\.)*?\bcreatedAt\b)(?=(?:[^"\\\n]|\\.)*?\b(?:timestamp|date)\b)(?=(?:[^"\\\n]|\\.)*?\bstatus\b)(?=(?:[^"\\\n]|\\.)*?\bcustomer)'
---
Passes when an assistant message before the first Write or Edit holds a record inventory that names the Order fields with their value kinds: totalCents as money, createdAt as a timestamp or date, status, and the customer relation. Only the agent's own text blocks count, so the skill text it reads cannot match.
