# Classification Guide

Use this guide when the user wants a response that is easier to read, easier to act on, or better presented than plain prose.

## Priority Order

1. Honor the user's explicit format request first.
2. Pick the output mode that best matches the content shape.
3. Prefer one primary mode.
4. Fall back to a concise structured brief when the request is broad or ambiguous.

## Mode Selection

- `explain`: use for definitions, concepts, cause/effect, or "what does this mean?"
- `visualize`: use for relationships, architecture, process flows, hierarchies, or state changes.
- `summarize_actions`: use for "what did you do?", progress reports, and change summaries.
- `compare`: use for trade-offs, choices, or "which is better?" questions.
- `checklist`: use for next steps, implementation tasks, or verification.
- `timeline`: use for sequences, phases, milestones, or chronology.
- `card` / `table`: use for compact scanning, summaries, and structured listings.
- `html`: use when the answer should become a reusable visual page or brief.
- `image`: use when the answer should become a single generated visual, diagram, or infographic.

## Signals

- Dense text, unclear scope, or "make this easier to read" -> `card` or structured brief.
- "Explain this" -> `explain`.
- "Show me" / "diagram" / "visualize" -> `visualize`.
- "What did you do?" / "what changed?" -> `summarize_actions`.
- "Compare" / "pros and cons" -> `compare`.
- "What should I do next?" -> `checklist`.
- "Step 1, step 2..." / "roadmap" / "phases" -> `timeline`.
- "Make it an HTML page" -> `html`.
- "Make it an image" -> `image`.

## Default Brief Template

When no mode stands out, answer with:

1. Takeaway
2. Why it matters
3. Key points
4. Next step
5. Risks or open questions

## Guardrails

- Avoid mixing many modes in one answer unless the user explicitly wants it.
- Keep visuals simple and readable; use hierarchy instead of decoration.
- If the user wants a visual but the content is not suited to an image, choose HTML or table instead and say why.
