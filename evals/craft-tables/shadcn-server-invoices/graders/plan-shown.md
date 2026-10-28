---
type: regex
target: trace
pattern: '^(?:(?!"name":"(?:Write|Edit)")[\s\S])*?\{"type":"assistant"[^\n]*?"type":"text","text":"(?=(?:[^"\\\n]|\\.)*?\bamountMinor\b)(?=(?:[^"\\\n]|\\.)*?\bmoney\b)(?=(?:[^"\\\n]|\\.)*?\bissuedOn\b)(?=(?:[^"\\\n]|\\.)*?\bdate\b)(?=(?:[^"\\\n]|\\.)*?\bstatus\b)(?=(?:[^"\\\n]|\\.)*?\bcustomer)'
---
Passes when an assistant message before the first Write or Edit holds a table plan that names the Invoice columns with their value kinds: amountMinor as money, issuedOn as a date, status, and the customer relation. Only the agent's own text blocks count, so the skill text it reads cannot match.
