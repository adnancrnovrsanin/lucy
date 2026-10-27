# Inspect evals

Two cases for the inspect skill, tagged `inspect`.

| Case | What it measures |
|---|---|
| seeded-raw-date | On a repository whose diff adds a booking form with a native date input, inspect fires on "inspect my changes", reports `raw-date-input` with the pointer to craft's field map, dates section, and leaves the file unchanged |
| not-a-review | On a request to explain a helper, inspect does not fire |

Run by hand; a run spends tokens:

    claude plugin eval . --tag inspect --scaffold --allow-tools Bash Write Edit --max-cost-usd 5
