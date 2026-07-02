# Memory Engine Baseline License Path Decision Packet

Status: Slice 2 local decision packet complete. Runtime implementation remains blocked.

Date: 2026-07-02

## Scope

This packet compares license paths for using `Source-Wire-Memory-Engine` as a runtime baseline without blurring Source-Wire's Apache-2.0 package boundary.

This is a planning and decision document only.

It does not:

- provide legal advice,
- approve runtime implementation,
- copy AGPLv3 code into Apache-2.0 Source-Wire,
- change Source-Wire's license,
- change package version,
- publish npm,
- create a GitHub release,
- accept public code contributions.

## Evidence

Local repo evidence:

- Source-Wire `LICENSE`: Apache-2.0.
- Source-Wire `package.json`: package license is `Apache-2.0`.
- [Source-Wire License Decision Gate](license-decision-gate.md).
- [Source-Wire License And Version Policy](license-version-policy.md).
- [Source-Wire Future License Change Plan](future-license-change-plan.md).
- [Memory Engine Baseline Runtime Capability Audit](memory-engine-baseline-runtime-capability-audit.md).
- `Source-Wire-Memory-Engine` `LICENSE`: GNU AGPLv3.
- `Source-Wire-Memory-Engine` `COMMERCIAL-LICENSE.md`: dual-license posture with AGPLv3 open-source use and commercial-license availability.

Primary license references:

- GNU Affero General Public License v3.0: `https://www.gnu.org/licenses/agpl-3.0.en.html`
- Apache License 2.0: `https://www.apache.org/licenses/LICENSE-2.0`

## First-Principles Constraint

The real constraint is not whether Source-Wire can learn from `Source-Wire-Memory-Engine`.

It can.

The real constraint is whether Apache-2.0 Source-Wire can include, modify, distribute, or tightly derive from AGPLv3 runtime code without changing Source-Wire's public license posture.

Default answer for now:

```text
Do not move AGPLv3 runtime code into Apache-2.0 Source-Wire.
```

Use the engine as:

- reference evidence,
- a separately licensed runtime candidate,
- a behavior benchmark,
- a possible out-of-process runtime behind a policy wrapper,
- or a source for clean-room requirements.

## Option Comparison

| Option | What it means | Public adopter impact | Future managed-hosted/SaaS impact | Contribution impact | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Keep `Source-Wire-Memory-Engine` as separate AGPLv3 reference runtime | Source-Wire stays Apache-2.0. The engine remains separate and AGPLv3. Source-Wire documents how an owner may run or evaluate it separately. | Clear but two-repo setup. Adopters must understand AGPLv3 duties if they modify or network-deploy the engine. | Managed-hosted path remains legally sensitive if it modifies or serves AGPLv3 engine code. Needs legal review or commercial license. | Source-Wire contributions can remain blocked or Apache-2.0 scoped. Engine contributions follow engine rules. | Best default now. |
| Build Apache-2.0 clean rewrite | Source-Wire implements runtime behavior from requirements, tests, contracts, and observed behavior, without copying AGPLv3 code. | Cleanest long-term Apache-2.0 adopter story. More work and slower. | Best future managed-hosted optionality because runtime code can remain Apache-2.0 if cleanly authored. | Requires clear contribution policy before accepting outside code. | Best long-term path if Source-Wire wants permissive runtime. |
| Dual-license owned code if possible | Obtain or create code that Source-Wire owner has rights to license under Apache-2.0 and another license if needed. | Potentially clean, but only if ownership and grants are explicit. | Good optionality if rights are actually owned or contractually granted. | Contribution acceptance becomes harder because inbound rights must support dual licensing. | Possible later, not default without counsel. |
| Separate runtime packages with clear boundary | Source-Wire remains Apache-2.0 contracts/control plane. Runtime package may be AGPLv3, commercial, or separate Apache-2.0 rewrite. | Flexible but more complex setup. Users choose the runtime with eyes open. | Managed-hosted path depends on which runtime is used and license terms. | Contributions must be routed by package license and policy. | Good architecture pattern, but still needs license docs. |

## Recommended Default Path

Use this default for the next implementation planning unit:

```text
Source-Wire remains Apache-2.0 contracts/control plane.
Source-Wire-Memory-Engine remains a separate AGPLv3 reference/runtime candidate.
Any Source-Wire runtime code must be clean-room Apache-2.0 or separately approved.
No AGPLv3 code moves into Source-Wire before legal review and owner approval.
```

Plain English:

- Do not merge the memory engine into Source-Wire.
- Do not copy files, functions, migrations, UI components, tests, or Docker code from the AGPLv3 engine into Source-Wire.
- Do use the engine to understand needed behavior.
- Do write Source-Wire contracts, wrapper boundaries, and future tests from scratch.
- Do keep public adopters safe from accidental license confusion.

## Why This Recommendation Wins

It preserves the most future options.

If Source-Wire keeps the runtime candidate separate:

- current Apache-2.0 package promises stay true,
- public adopters can inspect the boundary,
- owner-hosted users can choose their own comfort with AGPLv3 or wait for clean runtime,
- future managed-hosted or commercial paths are not accidentally boxed in,
- code contribution acceptance can stay blocked until the inbound-license posture is defined.

If Source-Wire copies AGPLv3 code too early:

- Apache-2.0 package clarity weakens,
- runtime and contracts become harder to separate,
- future SaaS/managed-hosted work becomes legally riskier,
- public contributors may submit code under unclear expectations,
- later cleanup becomes expensive.

## Public Adopter Implications

For adopters who only use current Source-Wire:

- they are using an Apache-2.0 contracts package,
- they are not running a memory backend from this repo,
- they are not receiving `Source-Wire-Memory-Engine` code through Source-Wire.

For adopters who also run `Source-Wire-Memory-Engine`:

- they are using a separate AGPLv3-licensed runtime candidate,
- they must evaluate AGPLv3 obligations for their own use,
- they should not assume Source-Wire's Apache-2.0 license applies to that runtime.

For adopters who want permissive runtime code:

- wait for a clean Apache-2.0 runtime implementation,
- or build against Source-Wire contracts without copying AGPLv3 code.

## Future Managed-Hosted Or SaaS Implications

Managed-hosted or SaaS use is not the default Source-Wire path.

If it becomes a later product path, the safest route is:

1. Apache-2.0 clean-room runtime code, or
2. explicit commercial license for the runtime dependency, or
3. legal review confirming the service architecture and obligations.

Do not build managed-hosted assumptions into the open-source path.

Do not rely on process separation alone as a legal conclusion. Treat process separation as an architecture tactic that still needs legal review if AGPLv3 code is part of the deployed service.

## Contribution Acceptance Implications

Public code contribution acceptance remains blocked.

Before accepting code, Source-Wire needs a contribution terms unit that answers:

- whether inbound contributions are Apache-2.0 only,
- whether a DCO or CLA is required,
- whether contributors can touch runtime code,
- whether any dual-license path is intended,
- whether contributors can submit code influenced by AGPLv3 implementation details,
- how maintainers reject code that copies incompatible code,
- how provenance is recorded for clean-room implementation.

Until then:

```text
Do not accept public code contributions.
```

## Clean-Room Rules For Future Runtime Work

If Source-Wire later writes Apache-2.0 runtime code, use these rules:

- Write from Source-Wire contracts, PRDs, tests, and behavior requirements.
- Do not copy AGPLv3 code, comments, file structure, migrations, UI components, test bodies, Dockerfiles, or config files.
- Keep implementation authorship notes in docs or PR descriptions.
- Use synthetic fixtures only.
- Keep a list of behavior requirements separate from source implementation.
- Require review for accidental code similarity when implementing equivalent behavior.

## Legal Review Questions

Ask counsel or a qualified open-source licensing reviewer:

1. Can Source-Wire distribute an Apache-2.0 control plane that optionally talks to a separately installed AGPLv3 runtime over HTTP or MCP without changing Source-Wire's license?
2. Does bundling both repos in one installer, Docker Compose file, package, or release artifact change the license analysis?
3. What boundary is required if an owner self-hosts both Source-Wire and the AGPLv3 runtime on the same machine?
4. What boundary is required if a managed-hosted operator runs an AGPLv3 runtime for customers?
5. Would a policy-wrapper process that calls an AGPLv3 runtime be considered a derivative or combined work in any relevant scenario?
6. What documentation must Source-Wire provide to prevent adopters from confusing Apache-2.0 Source-Wire with AGPLv3 runtime code?
7. What contribution policy is required before accepting runtime-related pull requests?
8. Can the current `Source-Wire-Memory-Engine` commercial-license path be used by Source-Wire, and under what terms?
9. If Source-Wire clean-room rewrites similar behavior, what provenance records should be retained?
10. Are there any patent, trademark, NOTICE, or attribution obligations that must be surfaced in public docs?

## Unresolved Risks

| Risk | Current posture |
| --- | --- |
| AGPLv3 compatibility with Apache-2.0 runtime ambitions | Unresolved. Keep code separate. |
| Process/API separation sufficiency | Unresolved. Do not treat as legal proof. |
| Managed-hosted use with AGPLv3 runtime | Unresolved. Needs legal review or commercial license. |
| Dual-license feasibility | Unresolved. Requires ownership and explicit grant path. |
| Public contribution contamination | Unresolved. Keep contributions blocked. |
| Clean-room implementation discipline | Needs future process and review gate. |

## Decision Record

Selected default path for now:

```text
Separate AGPLv3 reference runtime plus Apache-2.0 Source-Wire contracts/control plane.
Plan future Source-Wire runtime as clean-room Apache-2.0 unless legal review approves another path.
```

This decision allows Slice 3 to proceed locally:

- define API and MCP wrapper boundary,
- preserve Source-Wire policy enforcement,
- keep `Source-Wire-Memory-Engine` separate,
- avoid implementation,
- avoid code movement.

## Still Blocked

- runtime implementation,
- API server implementation,
- MCP server implementation,
- database migrations,
- memory-engine code copy,
- Docker or installer bundling with the AGPLv3 runtime,
- Mission Control UI,
- live connectors,
- deployment,
- production runtime use,
- managed-hosted operation,
- real user data,
- code contribution acceptance,
- new npm publishing,
- new GitHub release or tag.
