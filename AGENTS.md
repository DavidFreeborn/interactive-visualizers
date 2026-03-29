# AGENTS.md

Subagent definitions for the interactive-visualizers project.

---

## Active Agents

Agent definitions are in `.claude/agents/`:

| Agent | File | Purpose |
|-------|------|---------|
| scientific-auditor | `.claude/agents/scientific-auditor.md` | Scientific accuracy review |
| viz-reviewer | `.claude/agents/viz-reviewer.md` | Pedagogical/UX review |
| test-reviewer | `.claude/agents/test-reviewer.md` | Test coverage review |

---

## When to Use Agents

### scientific-auditor

**Use when:**
- Finalizing a visualizer specification
- Reviewing claims about physics, philosophy, or formal systems
- Checking scientific status labels
- Auditing "What This Shows/Doesn't Show" panels

**Do not use for:** Code style, general implementation questions

### viz-reviewer

**Use when:**
- View implementations are complete
- Before considering a visualizer done
- Evaluating visual encoding choices

**Do not use for:** Model logic, test coverage, scientific accuracy

### test-reviewer

**Use when:**
- Before marking a visualizer complete
- After writing tests, to verify coverage
- Identifying missing test categories

**Do not use for:** Writing tests, fixing code

---

## When NOT to Use Any Agent

- Simple file reads (use Read tool)
- Basic searches (use Grep/Glob)
- Straightforward edits
- Documentation updates
- Tasks already in context

**Rule:** If the task takes fewer than 3 tool calls to complete directly, do not spawn an agent.

---

## Retired Agents

### source-synthesizer

**Status:** Retired (paper notes complete)

Paper synthesis work is done. All seven source papers have notes in `docs/paper-notes/`. No further paper processing needed for current implementation batch.

---

## Agent Coordination

1. Main agent maintains architectural control
2. Agents provide recommendations, not directives
3. Agent output feeds back to main agent for action
4. Conflicting agent feedback escalates to user
