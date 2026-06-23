# Response Shaper Skill

Installable Codex skill package for turning dense answers into the clearest presentation mode.

## What it does

This skill classifies a request or answer and then reshapes it into the most useful form:

- `explain` for understanding and cause/effect
- `visualize` for flow, hierarchy, and relationships
- `summarize_actions` for what changed or what was done
- `compare` for trade-offs and options
- `checklist` for next steps and verification
- `timeline` for phases and chronology
- `html` for a shareable visual brief
- `image` for a single generated visual or infographic

When nothing is explicit, it falls back to a concise structured brief:

1. Takeaway
2. Why it matters
3. Key points
4. Next step
5. Risks or open questions

## Install

### From git

```bash
git clone <repo-url>
cd response-shaper-skill
npm install
npm run install:skill
```

### From npm

After publishing the package:

```bash
npm install response-shaper-skill
npx response-shaper-install
```

## Where it installs

By default, the installer copies the skill into:

`$CODEX_HOME/skills/response-shaper`

If `CODEX_HOME` is unset, it falls back to `~/.codex/skills/response-shaper`.

## Package contents

- `skill/SKILL.md`
- `skill/agents/openai.yaml`
- `skill/references/classification.md`
- `scripts/install-skill.js`

## Notes

- The deployable skill stays clean and uses `SKILL.md` as the trigger file.
- `README.md` is for humans and distribution; Codex does not read it as part of the skill trigger.
