# Source-Wire Visual System

These assets explain Source-Wire's trust model. They are documentation, not product screenshots or evidence of a hosted runtime.

## Visual Semantics

| Color | Meaning |
| --- | --- |
| Orange | Source evidence and owner-selected knowledge |
| Amber | Pending candidates and owner decisions |
| Green | Active trusted memory |
| Blue | Policy, MCP, and authorized agent access |
| Red | Rejected, revoked, or blocked state |
| Slate | Infrastructure, context, and neutral boundaries |

The color system is reinforced with text labels so meaning does not depend on color alone.

## Public Assets

| Asset | Purpose |
| --- | --- |
| [`source-wire-higgsfield-hero.jpg`](source-wire-higgsfield-hero.jpg) | Branded first-screen illustration of evidence, owner approval, trusted memory, and agent access. Generated with Higgsfield GPT Image 2 on 2026-07-24 and used as decorative explanation, not runtime evidence. |
| [`source-wire-overview.svg`](source-wire-overview.svg) | First-screen system overview for humans and AI agents |
| [`knowledge-vs-memory.svg`](knowledge-vs-memory.svg) | Knowledge-base and memory-system boundary |
| [`trusted-memory-lifecycle.svg`](trusted-memory-lifecycle.svg) | Candidate, approval, correction, and revocation lifecycle |
| [`source-wire-hero.jpg`](source-wire-hero.jpg) | Earlier illustrative hero, retained for project history but no longer used as the primary README explainer |

## Diagram Rules

- Use the same semantic color for the same state.
- Label every boundary in plain language.
- State what a connection cannot do when that prevents a false assumption.
- Keep owner control visible wherever trusted memory changes state.
- Treat a knowledge provider as optional and read-only.
- Keep PostgreSQL adopter-owned.
- Never imply that diagrams prove hosting, deployment, production readiness, or real-data support.

SVG source is intentionally text-readable so AI agents can inspect the same mental model shown to human readers.
