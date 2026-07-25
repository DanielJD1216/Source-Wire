# Alpha 1 Story 6 Local CLI Integration Issue Drafts

Status: Owner-approved and published in dependency order.

Date: 2026-07-24

Remote issue status: Published as GitHub issues #278 through #285.

## Parent

Accepted design:

- [Alpha 1 Story 6 Local CLI Integration Design](alpha1-story6-local-cli-integration-design.md)

Parent unit:

```text
Alpha 1 Story 6 Local CLI Integration
```

## Scope Boundary

These issues prove a local, adopter-operated CLI path for Source-Wire using
synthetic data and disposable PostgreSQL.

They do not authorize:

- a Source-Wire account or control plane,
- Source-Wire-operated infrastructure,
- telemetry or billing,
- managed PostgreSQL or provider provisioning,
- a live knowledge connector,
- private or real evidence,
- production or non-disposable database use,
- hosted API or MCP use,
- HTTP or SSE MCP,
- provider hot reload or a provider registry,
- deployment,
- automatic trusted-memory promotion,
- npm publication,
- a GitHub tag or release.

Every adopter remains responsible for selecting, operating, and paying for
their own device or server, PostgreSQL, knowledge base, credentials, storage,
models, third-party APIs, backups, and network usage.

## User Stories

### US6.1: Initialize a local installation safely

As an adopter, I can create and validate a non-secret local Source-Wire
configuration without creating an account, contacting a service, provisioning
infrastructure, or mutating a database.

### US6.2: Run Source-Wire for a local AI agent

As an AI-agent operator, I can start the local runtime and stdio MCP through one
predictable CLI command while API policy, credentials, logs, and cleanup remain
inside the Source-Wire process boundary.

### US6.3: Connect one owner-selected knowledge provider

As an owner, I can bind zero or one conforming read-only provider at startup
without allowing MCP or API callers to select the provider, its credentials,
its scope, or its authority.

### US6.4: Diagnose failures without leaking secrets

As an operator, I can receive deterministic, machine-readable diagnostics for
configuration, database, provider, API, and MCP failures without exposing
credentials, endpoints, private queries, or evidence.

### US6.5: Control database changes explicitly

As an operator, I can inspect migration compatibility and apply a reviewed
migration only through an explicit mutation command using separate migrator
authority.

### US6.6: Export owner-controlled memory locally

As an owner, I can create a bounded, secret-free local export without uploading
it to Source-Wire or granting export authority to an AI-agent harness.

### US6.7: Prove evidence-first compatibility

As an adapter author, I can run the evidence-first knowledge-base synthetic
adapter through the same local CLI, provider host, protected-read audit, and
stdio MCP path without importing Source-Wire internals.

### US6.8: Install the local path without maintainer-funded services

As an adopter, I can install and verify a local-runtime package candidate that
has no Source-Wire account, API key, telemetry, billing, or hosted-service
dependency.

## Proposed Dependency Order

```text
Issue 1: non-secret init and offline doctor
  -> Issue 2: memory-only local stdio runtime
    -> Issue 3: immutable synthetic provider composition
      -> Issue 4: fail-closed orchestration and cleanup
        -> Issue 5: explicit database control plane
          -> Issue 6: owner-controlled local export
            -> Issue 7: evidence-first synthetic cross-repository proof
              -> Issue 8: no-publish local-runtime package candidate
```

Issues 1 through 7 are AFK once their blockers are complete. Issue 8 is HITL
because expanding the distributable runtime dependency and support boundary
requires a fresh security, package, advisory, and owner decision before a
candidate is prepared.

No issue in this packet publishes a package or release.

## Published Issues

1. [#278 Story 6.1: Deliver non-secret init and offline doctor](https://github.com/DanielJD1216/Source-Wire/issues/278)
2. [#279 Story 6.2: Run the memory-only local runtime through stdio](https://github.com/DanielJD1216/Source-Wire/issues/279)
3. [#280 Story 6.3: Compose one synthetic provider through the local CLI](https://github.com/DanielJD1216/Source-Wire/issues/280)
4. [#281 Story 6.4: Fail closed across local orchestration and cleanup](https://github.com/DanielJD1216/Source-Wire/issues/281)
5. [#282 Story 6.5: Add the explicit database control plane](https://github.com/DanielJD1216/Source-Wire/issues/282)
6. [#283 Story 6.6: Add owner-controlled local export](https://github.com/DanielJD1216/Source-Wire/issues/283)
7. [#284 Story 6.7: Prove evidence-first compatibility end to end](https://github.com/DanielJD1216/Source-Wire/issues/284)
8. [#285 Story 6.8: Prepare a no-publish local-runtime package candidate](https://github.com/DanielJD1216/Source-Wire/issues/285)

## Issue 1: Deliver Non-Secret Init And Offline Doctor

**Type:** AFK

**Blocked by:** None, can start immediately

**User stories covered:** US6.1, US6.4, US6.8

**Latest-source implementation status:** Complete. Verified by
`npm run alpha1:test`, documentation checks, safety and claim scans, and a
compiled clean-directory CLI smoke. Publication and release remain out of
scope.

Use Node.js 22 with npm. Follow the
[Quickstart](../getting-started/quickstart.md) before running local commands.

### What to build

Deliver the first private Alpha `source-wire-local` tracer from an empty
directory to a validated local configuration.

The initialization command creates only a non-secret configuration template.
The offline diagnostic command validates configuration, exact package and
contract compatibility, required environment-variable names, loopback and
stdio restrictions, and local file permissions without importing provider
code, connecting PostgreSQL, contacting a service, or mutating state.

Both commands expose deterministic human-readable and JSON results through one
redacted result envelope.

### Acceptance criteria

- [x] Initialization creates a versioned local configuration containing secret references rather than secret values.
- [x] Initialization creates no account, performs no network request, provisions no service, applies no migration, and loads no provider.
- [x] Existing files are not overwritten.
- [x] Configuration accepts zero or one provider declaration and exactly one stdio MCP transport.
- [x] Configuration rejects a provider registry, hot reload, remote API binding, HTTP or SSE MCP, arbitrary shell hooks, and raw secret values.
- [x] Offline diagnostics do not import provider code or connect to PostgreSQL.
- [x] Human-readable and JSON outputs use the same stable operation and error vocabulary.
- [x] Diagnostics omit environment values, endpoints, credentials, private paths, queries, and evidence.
- [x] The existing contracts-package validation command remains unchanged.
- [x] Tests prove installation and diagnostics contain no Source-Wire account, API key, telemetry, billing, or hosted-service path.

## Issue 2: Run The Memory-Only Local Runtime Through Stdio

**Type:** AFK

**Blocked by:** #278

**User stories covered:** US6.2, US6.4, US6.8

### What to build

Deliver the smallest complete local runner from validated configuration through
disposable PostgreSQL, migration compatibility inspection, loopback API policy,
least-privilege process credentials, and stdio MCP in memory-only mode.

The CLI owns startup order, protocol and diagnostic stream separation,
coordinated shutdown, and process-scoped credential invalidation. A real MCP
client must be able to discover and use the two existing memory tools through
the runner without a knowledge provider.

### Acceptance criteria

- [ ] One CLI command starts the local API on loopback and the MCP server over stdio.
- [ ] Startup verifies migration compatibility but never applies migrations.
- [ ] A no-provider configuration starts successfully in memory-only mode.
- [ ] The official MCP client discovers exactly the two memory tools when no provider is configured.
- [ ] Candidate proposal and authorized trusted-memory search pass through API policy rather than direct database access.
- [ ] The MCP process receives no owner, migrator, provider, or direct database authority.
- [ ] MCP protocol frames use stdout and redacted diagnostics use stderr.
- [ ] API or MCP startup failure stops the entire local composition.
- [ ] Shutdown invalidates process-scoped credentials and removes generated processes, roles, databases, and temporary files.
- [ ] The path uses generated synthetic state and contacts no Source-Wire-operated service.

## Issue 3: Compose One Synthetic Provider Through The Local CLI

**Type:** AFK

**Blocked by:** #279

**User stories covered:** US6.2, US6.3, US6.4

### What to build

Extend the local runner with the existing public-contract synthetic provider
through the immutable zero-or-one-provider composition seam.

Add a provider-check command that validates configuration and the provider
profile before runtime startup. With explicit connected checking, it may load
the owner-selected provider and invoke only the bounded readiness operation.
Then prove source-evidence search and exact fetch through the real CLI, stdio
MCP, loopback API policy, provider host, durable audit, and single-use release
receipt.

### Acceptance criteria

- [ ] The provider check validates contract identity, version, family, capabilities, scope, bounds, read-only posture, provenance, and no-auto-promotion behavior.
- [ ] Offline provider checking does not load executable provider code.
- [ ] Connected provider checking is explicit and releases no evidence.
- [ ] Runtime startup accepts zero or one immutable provider composition.
- [ ] MCP and API callers cannot select provider identity, scope, module, endpoint, credentials, owner, namespace authority, or ACL decisions.
- [ ] The four-tool stdio surface appears only when the provider is configured successfully.
- [ ] Search and exact fetch pass through Source-Wire policy, audit, and response-release behavior.
- [ ] Provider credentials and retrieval clients do not enter Source-Wire configuration, MCP input, diagnostics, or audit metadata.
- [ ] Provider reads create zero candidates and zero trusted memories.
- [ ] Replacing the provider requires owner-controlled configuration plus process restart; no registry or hot reload exists.

## Issue 4: Fail Closed Across Local Orchestration And Cleanup

**Type:** AFK

**Blocked by:** #280

**User stories covered:** US6.2, US6.3, US6.4

### What to build

Close the local runner's failure boundary across invalid configuration,
incompatible migrations, malformed provider composition, missing credentials,
provider failure, database outage, child crash, response interruption, and
shutdown races.

Every failure must produce one stable redacted CLI result, release zero
unaudited protected content, stop all dependent processes, invalidate
process-scoped credentials, and preserve the existing trusted-memory and
source-evidence audit-before-release guarantees.

### Acceptance criteria

- [ ] Missing or malformed configuration, secret references, and package versions fail before process startup.
- [ ] Non-loopback API binding and non-stdio MCP transports are rejected.
- [ ] Incompatible migrations fail startup without automatic mutation.
- [ ] Malformed provider profiles and binding mismatches invoke no provider and release no evidence.
- [ ] Provider, API, MCP, and database outages stop the local composition with stable safe errors.
- [ ] Audit failure, receipt mismatch, replay, foreign-process consumption, and response-write interruption release zero protected content.
- [ ] stdout never contains diagnostics or malformed MCP protocol frames.
- [ ] stderr, JSON diagnostics, logs, and reports contain no credentials, endpoints, private queries, evidence bodies, or hidden result counts.
- [ ] Crash and interruption tests prove deterministic child, credential, database, and temporary-file cleanup.
- [ ] Existing Alpha Stories 1 through 5 remain green.

## Issue 5: Add The Explicit Database Control Plane

**Type:** AFK

**Blocked by:** #281

**User stories covered:** US6.4, US6.5

### What to build

Add database status and migration commands behind the same local CLI result and
configuration boundary.

Status remains read-only. Migration is an explicit operator mutation that uses
separate migrator authority, displays the current and target migration set,
requires an apply flag, records a safe result, and never runs as a side effect
of initialization, diagnostics, provider checks, or MCP startup.

### Acceptance criteria

- [ ] Database status reports compatible, pending, incompatible, and unavailable states without mutation.
- [ ] Database status uses no owner, harness, or provider credential.
- [ ] Migration requires distinct migrator authority and an explicit apply flag.
- [ ] The command prints the current and target migration set before applying changes.
- [ ] Initialization, diagnostics, provider checking, and MCP startup never apply migrations.
- [ ] Migration success and failure return the same stable redacted CLI envelope as other commands.
- [ ] Missing, wrong-class, or over-privileged credentials fail safely.
- [ ] Migration output contains no database URL, credential, schema secret, or private data.
- [ ] Disposable PostgreSQL conformance proves least privilege, idempotency, rollback behavior, and cleanup.
- [ ] No managed PostgreSQL provisioning or persistent database support is introduced.

## Issue 6: Add Owner-Controlled Local Export

**Type:** AFK

**Blocked by:** #282

**User stories covered:** US6.4, US6.6

### What to build

Expose the existing bounded portable export through the local CLI as an
explicit owner action.

The command accepts an explicit namespace set and destination, requires owner
authority, writes atomically, preserves deterministic secret-free output, and
never uploads the result or grants export authority to MCP.

### Acceptance criteria

- [ ] Export requires owner authority and rejects harness, runtime, migrator, and provider credentials.
- [ ] The owner supplies an explicit namespace set and local destination.
- [ ] Output uses the current bounded canonical portable format.
- [ ] The destination is written atomically with safe local permissions.
- [ ] Existing files are not overwritten without an explicit accepted policy.
- [ ] Output contains no credentials, verifier material, provider secrets, database locators, or process release secrets.
- [ ] MCP exposes no export, recovery, correction, revocation, or owner-admin tool.
- [ ] Export sends no data to Source-Wire or any third party.
- [ ] JSON and human-readable results remain deterministic and redacted.
- [ ] Disposable conformance proves interruption safety and cleanup.

## Issue 7: Prove Evidence-First Compatibility End To End

**Type:** AFK

**Blocked by:** #281 and completion of the evidence-first knowledge-base synthetic adapter prerequisites

**User stories covered:** US6.3, US6.7, US6.8

### What to build

Run a separately implemented evidence-first synthetic adapter through the same
local CLI composition used by the Source-Wire synthetic provider.

The adapter must import only the published public contracts and use a
provider-owned authorized evidence reader. The complete tracer must cross the
local CLI, immutable provider binding, loopback API policy, protected provider
host, durable metadata-only audit, single-use response receipt, stdio MCP, and
official MCP client.

Source-Wire must not import the knowledge base's database, credential,
authorization, ranking, or retrieval implementation.

### Acceptance criteria

- [ ] The adapter depends on a stable published Source-Wire contracts version rather than a Git commit.
- [ ] The adapter imports no private Alpha host, database, API, MCP, audit, receipt, credential, or memory-store implementation.
- [ ] Search returns ordered provider-ready synthetic evidence with complete provenance and bounds.
- [ ] Exact fetch returns the matching synthetic source and segment only.
- [ ] Inactive, deleted, denied, incomplete, oversized, late, and cross-scope evidence releases zero protected content.
- [ ] Source-Wire receives no knowledge-base database credential, endpoint, SQL, entitlement implementation, or ranking implementation.
- [ ] The knowledge-base adapter receives no Source-Wire actor context, owner credential, audit store, process secret, receipt authority, or memory mutation authority.
- [ ] The same local CLI and provider-check commands work without provider-specific branches.
- [ ] Cross-repository conformance proves zero knowledge-base writes and zero automatic memory promotion.
- [ ] All fixtures are synthetic and no private endpoint, credential, evidence, or deployment detail enters either repository.

## Issue 8: Prepare A No-Publish Local-Runtime Package Candidate

**Type:** HITL

**Blocked by:** #282, #283, and #284

**User stories covered:** US6.8

### What to build

After explicit owner confirmation of the final package name and support
boundary, prepare an installable local-runtime package candidate containing
the supported composition API and `source-wire-local` CLI.

Verify the packed artifact from a clean consumer and AI-agent MCP
configuration. Keep contracts, runtime, provider adapters, and adopter
infrastructure as separate dependencies. The candidate must not be published,
tagged, released, deployed, or described as production-ready.

Because a distributable runtime package changes the current Alpha dependency
and support scope, re-review the known MCP dependency advisory before preparing
the candidate. The existing dated Alpha disposition cannot be carried forward
silently.

### Acceptance criteria

- [ ] The owner explicitly confirms the final package name, binary name, support level, and compatibility policy.
- [ ] A fresh dependency and security review resolves or explicitly re-dispositions every advisory for the candidate's exact runtime, transport, and platform scope.
- [ ] The contracts package remains lightweight and preserves the existing validation command.
- [ ] The local-runtime candidate exposes the supported programmatic composition API and local CLI without exporting private Alpha internals.
- [ ] A clean installed consumer can initialize, diagnose, compose the synthetic provider, and start stdio MCP against disposable PostgreSQL.
- [ ] A clean AI-agent configuration can invoke the installed binary without `npx` downloading mutable code at session startup.
- [ ] Package contents exclude credentials, generated databases, conformance artifacts, private paths, evidence, deployment configuration, and hosted-service code.
- [ ] Installation and execution require no Source-Wire account, API key, telemetry, billing, or Source-Wire-operated endpoint.
- [ ] Release notes preserve all production, hosting, deployment, real-data, live-provider, and non-disposable database blocks.
- [ ] No npm publish, GitHub tag, GitHub release, deployment, or hosted-service mutation occurs.

## Deferred Work

The following work is not ready for issue publication under Story 6:

- live evidence-first knowledge-base credentials or endpoints,
- production provider operation,
- production secret custody,
- non-disposable database migration,
- hosted API or MCP,
- HTTP or SSE MCP,
- Windows runtime support,
- managed hosting,
- a Source-Wire billing or account service,
- public runtime package publication,
- deployment,
- real user or client data,
- automatic memory promotion.
