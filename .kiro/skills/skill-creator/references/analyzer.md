# Post-hoc Analyzer Agent

Two modes: (1) analyze why a blind comparison winner won, or (2) analyze benchmark results for patterns.

---

## Mode 1: Comparison Analysis

After a blind comparison, "unblinds" results to extract actionable improvement suggestions.

### Inputs

- **winner**: "A" or "B"
- **winner_skill_path** / **loser_skill_path**: Paths to both skills
- **winner_transcript_path** / **loser_transcript_path**: Execution transcripts
- **comparison_result_path**: Blind comparator's JSON output
- **output_path**: Where to save analysis

### Process

1. Read comparison result — note what the comparator valued
2. Read both skills — identify structural differences (clarity, scripts, examples, edge cases)
3. Read both transcripts — compare execution patterns, tool usage, errors
4. Score instruction-following 1-10 for each
5. Identify winner strengths and loser weaknesses
6. Generate prioritized improvement suggestions

### Output

```json
{
  "comparison_summary": {"winner": "A", "winner_skill": "...", "loser_skill": "...", "comparator_reasoning": "..."},
  "winner_strengths": ["specific strength with evidence"],
  "loser_weaknesses": ["specific weakness with evidence"],
  "instruction_following": {
    "winner": {"score": 9, "issues": []},
    "loser": {"score": 6, "issues": ["specific missed instruction"]}
  },
  "improvement_suggestions": [
    {"priority": "high|medium|low", "category": "instructions|tools|examples|error_handling|structure|references", "suggestion": "concrete change", "expected_impact": "what it would fix"}
  ],
  "transcript_insights": {"winner_execution_pattern": "...", "loser_execution_pattern": "..."}
}
```

---

## Mode 2: Benchmark Analysis

Surface patterns across multiple runs that aggregate metrics hide.

### Inputs

- **benchmark_data_path**: Path to benchmark.json
- **skill_path**: Skill being benchmarked
- **output_path**: Where to save notes

### Process

Look for:
- Assertions that always pass in both configs (non-discriminating)
- Assertions that always fail in both (broken or beyond capability)
- High-variance evals (possibly flaky)
- Surprising results contradicting expectations
- Time/token outliers skewing aggregates

### Output

JSON array of observation strings:

```json
[
  "Assertion 'X' passes 100% in both configurations - doesn't differentiate skill value",
  "Eval 3 shows high variance (50% ± 40%) - possible flaky test",
  "Skill adds 13s average but improves pass rate by 50%"
]
```

### Guidelines (both modes)

- Be specific — quote from skills/transcripts/data
- Be actionable — concrete changes, not vague advice
- Focus on causation — did the weakness actually cause the worse output?
- Think about generalization — would this help on other evals too?
