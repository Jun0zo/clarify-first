# Clarify First Benchmarks

This pack is for testing **format selection and comprehension**, not image beauty.

## Existing Benchmarks

| Benchmark | What it measures | Why it helps here | Main limitation |
| --- | --- | --- | --- |
| [IFEval](https://arxiv.org/abs/2311.07911) | Verifiable instruction following | Good for format constraints and exact output rules | Not tailored to `clarify-first` style choices |
| [M-IFEval](https://arxiv.org/abs/2502.04688) | Multilingual instruction following | Useful as a multilingual companion benchmark | Supports French, Japanese, and Spanish, not Korean |
| [FollowBench](https://arxiv.org/abs/2310.20410) | Layered constraints across style, format, and examples | Matches "choose the right shape" workflows | Not specific to summaries / visual briefs |
| [ComplexBench](https://arxiv.org/html/2407.03978v1) | Multi-constraint following | Good for markdown / structure / length constraints | Still not a direct clarity benchmark |
| [HELM Instruct](https://crfm.stanford.edu/2024/02/18/helm-instruct.html) | Helpfulness, completeness, understandability, conciseness | Strong fit for "understanding-first" outputs | Human review is still needed |
| [AlpacaEval](https://github.com/tatsu-lab/alpaca_eval) | General instruction-following quality | Good regression baseline | Not format-centric |
| [MT-Bench](https://arxiv.org/abs/2306.05685) | General assistant quality | Useful as a broad sanity check | Too broad for format-selection accuracy |

## 1. Benchmark Design

| Layer | What to test | Example signal | Why it matters |
| --- | --- | --- | --- |
| Format choice | Pick the right mode (`explain`, `visualize`, `html`, `image`, etc.) | Markdown table, mermaid diagram, HTML card, checklist | This is the core skill |
| Constraint adherence | Keep required markers, avoid forbidden ones, stay within length limits | Required phrases, max words, no accidental prose bloat | Ensures the shape is actually correct |
| Language fit | Mirror the user's language by default | Korean outputs for Korean prompts, mixed-language handling | This skill is multilingual-first |
| Clarity | Keep the answer easy to scan and not overly verbose | Short labels, sections, bullets, direct takeaway | This is the user value |
| Image mode discipline | Turn image requests into good image prompts, not pretty images | subject/style/composition/palette/mood fields | We score the prompt structure, not image aesthetics |

## 2. Evaluation Rubric

| Dimension | Weight | Pass rule | Notes |
| --- | --- | --- | --- |
| Format selection | 50 | Output matches the expected shape signal for the case | Highest priority |
| Constraint adherence | 25 | Required markers are present and forbidden markers are absent | Hard requirement |
| Brevity / scanability | 15 | Stays under the case limit or degrades only slightly | Long prose is a fallback, not default |
| Language fit | 10 | Matches the case language well enough to read naturally | Secondary to format |

Pass threshold:

| Result | Rule |
| --- | --- |
| Pass | Score >= 80 and all hard constraints pass |
| Review | Score 60-79 or any ambiguous case |
| Fail | Score < 60 or a hard constraint breaks |

## 3. Auto-Scoring Structure

| Step | Input | Output |
| --- | --- | --- |
| Load cases | `benchmarks/cases.json` | Normalized benchmark cases |
| Load results | JSON array of `{ id, output }` | Map of case id to output |
| Score format | Mode-specific signals | Format score + pass/fail |
| Score constraints | Required and forbidden markers | Constraint score + hard fail flags |
| Score brevity | Word limit | Brevity score |
| Score language | Locale signal | Language score |
| Report | All case scores | Markdown table + summary line |

## How To Use

1. Create or capture candidate outputs for the cases in `cases.json`.
2. Save them as a JSON array with `id` and `output`.
3. Run:

```bash
node benchmarks/run-benchmark.mjs --results /path/to/results.json
```

## What This Does Not Measure

- Visual polish of generated images
- Subjective brand taste
- Absolute model intelligence

For this skill, the most important signal is still whether the output came back in the **right format**.
