---
type: regex
target: trace
# The peek reuses the customer view: a file the agent wrote, other than the page route and the view itself, imports the customer-details module.
pattern: '"name":"(?:Write|Edit)","input":\{"file_path":"(?![^"]*(?:\$customerId|customer-details\.tsx))[^"]*",(?:"old_string":"(?:[^"\\\n]|\\.)*?",)?"(?:content|new_string)":"(?:[^"\\\n]|\\.)*?\bfrom (?:''|\\")[\w@./-]*/customer-details(?:\.tsx)?(?:''|\\")'
---
