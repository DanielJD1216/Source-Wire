# `second-brain.v1` Contract

## Purpose

`second-brain.v1` is a simple response contract for agent harnesses.

It gives an agent a predictable way to ask memory-backed questions, request diagrams, or trigger explicit source updates while preserving citations and review boundaries.

## Request Shape

Example:

```json
{
  "command": "/2nd-brain",
  "prompt": "What is the current decision for the Atlas Demo Workspace?",
  "radius": "project"
}
```

## Response Shape

Required response fields:

- `contractVersion`,
- `intent`,
- `radius`,
- `answer`,
- `citations`,
- `gaps`,
- `nextAction`,
- `maintenanceRan`,
- `noAutoPromotion`.

Example:

```json
{
  "contractVersion": "second-brain.v1",
  "intent": "answer_question",
  "radius": "project",
  "answer": "The current decision is to import notes as source evidence before creating trusted memory.",
  "citations": [],
  "gaps": [],
  "nextAction": "Review any proposed memory candidate before promotion.",
  "maintenanceRan": false,
  "noAutoPromotion": true
}
```

## Radius

Radius controls how wide the system should search.

Common values:

- `project`,
- `source`,
- `global`.

The system should prefer the narrowest useful radius and widen only when the user request needs it.

## Maintenance Boundary

Normal read requests should not run source maintenance.

Updates should happen only when the caller explicitly asks for an update and supplies source payload evidence or a valid connection workflow.

## Synthetic Fixture

See:

```text
examples/fixtures/second-brain/use-2nd-brain-example.json
```
