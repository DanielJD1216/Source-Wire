# Source-Wire Memory Engine Baseline Grill Outcome

Status: accepted planning decision. Implementation remains blocked.

## Focus

This checkpoint resolves the first focused Grill Me question for the Source-Wire memory-engine baseline path.

Question:

```text
Should the next unit treat Source-Wire-Memory-Engine as a separate AGPLv3 reference runtime that Source-Wire audits and wraps, not merges, until we choose a license path?
```

Recommended answer accepted for planning:

```text
Yes.
```

## Decision

`Source-Wire-Memory-Engine` stays a separate AGPLv3 reference runtime for the next planning unit.

Source-Wire should audit, map, and wrap the memory-engine boundary before deciding whether to:

- keep it as a separate AGPLv3 reference implementation,
- rewrite runtime code under Apache-2.0,
- dual-license owned runtime code,
- or keep Apache-2.0 contracts separate from an AGPLv3 runtime package.

## Why

Source-Wire is currently Apache-2.0 and already published as `@source-wire/contracts@0.1.0`.

`Source-Wire-Memory-Engine` is AGPLv3 because it is based on Open-RLM-Memory. Its code can inform the runtime path, but copying it directly into Apache-2.0 Source-Wire would blur the license boundary.

The safest next step is a public-safe audit and interface plan:

```text
Source-Wire contracts
  -> define public memory and MCP behavior
  -> audit AGPL runtime fit
  -> wrap through explicit API/MCP boundary
  -> decide license path before code absorption
```

## What This Does Not Approve

This decision does not approve:

- copying AGPLv3 code into Apache-2.0 Source-Wire,
- adding a hosted runtime,
- adding a real API server,
- adding a real MCP server,
- adding database migrations,
- adding Mission Control UI,
- connecting live sources,
- publishing a new npm version,
- creating a new GitHub release,
- accepting public code contributions,
- adding real user data.

## Next Step

Run the visual system audit and PRD/slicing gate for the Source-Wire memory-engine baseline audit.
