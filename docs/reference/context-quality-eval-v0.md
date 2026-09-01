# Context Quality Eval v0

Context Quality Eval v0 is an offline, deterministic evaluation of the synthetic Context Inbox runtime skeleton. It measures whether Source Wire returns the expected source evidence while preserving provenance, freshness, authorization, retention, replay, and memory-lifecycle boundaries.

It evaluates Source Wire behavior, not general LLM intelligence. It makes no model calls and uses no LLM-as-judge scoring.

## What It Proves

The versioned corpus evaluates eight dimensions:

1. `retrieval_quality`
2. `citation_and_provenance`
3. `freshness_and_revision`
4. `authorization_and_isolation`
5. `retention_and_response_safety`
6. `replay_and_conflict`
7. `memory_lifecycle_separation`
8. `adversarial_robustness`

The passing corpus proves that the current synthetic runtime skeleton:

- returns each exact expected evidence set;
- excludes irrelevant metadata matches and superseded source revisions;
- returns a bounded empty result for a valid unanswerable query;
- rejects a malformed or semantically empty query;
- preserves exact allowlisted source identity, revision, locator, citation, content digest, envelope digest, and freshness metadata;
- keeps scoped freshness monotonic even when a filtered result is older than the newest scoped capture;
- denies cross-owner, cross-namespace, missing-capability, mixed-state, malformed, and adversarial requests without releasing evidence;
- retains and returns no submitted source body;
- treats exact retries and legitimate re-observation idempotently while rejecting conflicting request, envelope, and source-revision identity reuse;
- creates no pending candidate and no trusted memory during capture or retrieval;
- does not automatically promote source evidence into memory.

The corpus asserts evidence sets, not ranking. `orderingContract` is `set_only` because Context Inbox does not currently guarantee relevance ordering.

## Corpus

The public-safe corpus is:

```text
examples/fixtures/runtime-skeleton/context-quality-eval-v0.json
```

Its `corpusVersion` is `1.0.0`. Every source, owner, namespace, locator, body, identifier, and timestamp is synthetic. The runner performs no network access and does not connect to a database, provider, hosted runtime, or live connector.

The corpus contains:

- capture cases for current, superseded-shaped, unrelated, and historical evidence;
- search cases with exact expected evidence identities and `k` values;
- exact retry, legitimate re-observation, and replay-conflict cases;
- owner, namespace, capability, mixed-state, malformed, descriptor, array, prototype, and Proxy boundary cases.

Cases are individually identified. The required v1 case and recipe matrix and the complete expected-outcome oracle are pinned by evaluator controls, and the collected observation matrix must match them. Missing, extra, reordered, altered, unknown, or unevaluated cases fail the evaluation instead of redefining or reducing the denominator.

## Retrieval Semantics

Eval v0 uses the real Context Inbox capture and search transitions exported by the built package. It does not implement a second retrieval engine.

Search relevance is deterministic metadata-token matching over the retained source-evidence allowlist. Source bodies are not retained and therefore are not searchable. Current-revision selection is deterministic per source record. A valid query with no matching metadata returns zero evidence. A query with no searchable token after normalization, including a blank or stopword-only query, fails closed.

## Metrics And Hard Thresholds

The runner pins these thresholds in code and requires the corpus threshold object to match exactly:

| Metric | Hard threshold |
| --- | ---: |
| Retrieval expected-set accuracy | `1` |
| Precision@K | `1` |
| Recall@K | `1` |
| Citation/provenance fidelity | `1` |
| Owner leakage | `0` |
| Namespace leakage | `0` |
| Source-body leakage | `0` |
| Unauthorized candidate creation | `0` |
| Unauthorized trusted-memory creation | `0` |
| Replay violations | `0` |
| Freshness violations | `0` |
| Adversarial escapes | `0` |
| Unhandled cases | `0` |

Expected-set accuracy is the fraction of search cases whose returned evidence identity set exactly equals the expected set. Precision@K uses `K` as its denominator, while Recall@K uses the expected evidence count. A duplicated returned identity counts as one hit while each returned duplicate still occupies a result position, and an unfilled result position is not relevant, so duplicate or incomplete retrieval lowers the metrics. Empty expected sets score `1` only when retrieval is also empty.

Citation/provenance fidelity requires exact allowlisted projections and exact independently derived citation and digest bindings. A single mismatch fails the run.

Leakage, lifecycle, replay, freshness, adversarial, and unhandled counts are hard invariants. Every observed result graph is rejected recursively if any value is a Proxy, then copied into a descriptor-safe null-prototype scoring snapshot; unsnapshottable or structurally invalid results fail before specialized metric or isolation access. Top-level results, evidence, citations, state, audit metadata, and arrays are checked against exact descriptor-aware own-key allowlists, including element descriptors, non-enumerable keys, and symbols. A code-pinned digest over all 34 ordered result projections independently fixes every expected value and array cardinality, including audit and lifecycle fields. Source-body checks detect complete submitted bodies and bounded 24-character-or-longer excerpts without invoking accessors. Any nonzero hard invariant fails the run.

## Run It

Use Node.js 22 from the repository root:

```bash
npm run runtime:skeleton-smoke
```

That existing protected smoke path builds the package, runs the runtime fixture matrix, runs Context Quality Eval v0, and runs its mutation self-test. No dedicated `package.json` script was added.

For focused development:

```bash
npm run build
node --test examples/runtime-skeleton/context-quality-eval-v0.test.mjs
node examples/runtime-skeleton/context-quality-eval-v0.mjs
node examples/runtime-skeleton/context-quality-eval-v0.mjs --json
node examples/runtime-skeleton/context-quality-eval-v0.mjs --self-test
```

The default command emits a concise human-readable scorecard followed by canonical JSON. `--json` emits only canonical JSON. The report contains no timestamp, random identifier, absolute path, environment-specific value, or source body, so repeated runs on the same code and corpus are byte-stable.

## Canonical Report

The machine-readable report has these top-level fields:

- `evalType`
- `corpusVersion`
- `fixtureSafety`
- `execution`
- `evaluatedDimensions`
- `verdict`
- `caseTotals`
- `metrics`
- `thresholds`
- `failures`

`execution` records that network access is `none`, model judging is disabled, and ordering is set-only. `caseTotals` includes total, passed, failed, and unhandled counts. `failures` contains stable case identifiers, dimensions, and bounded reasons. It never includes fixture source bodies.

## Mutation Sensitivity

The isolated self-test sabotages cloned evaluator observations or evaluator controls. It does not modify production runtime behavior or the normal passing corpus. The required probes demonstrate detection of:

- incorrect retrieval;
- citation mismatch;
- source-body leakage;
- unauthorized candidate and trusted-memory creation;
- replay-conflict acceptance;
- authorization-boundary acceptance;
- cross-owner evidence leakage;
- malformed-boundary acceptance;
- weakened hard thresholds.

Every probe must produce an explicit failing report or corpus rejection. The self-test passes only when all probes are detected.

## What It Does Not Prove

Eval v0 does not establish:

- downstream model outcome lift;
- answer quality from any LLM;
- live connector correctness;
- real-data safety or quality;
- production performance, scale, latency, or availability;
- production database, backup, restore, observability, or rollback readiness;
- hosting, deployment, or production readiness;
- package publication or release status.

Those require separately authorized evaluation work. PostgreSQL operations issue #296 remains a separate track. Eval v0 adds no automatic trusted-memory promotion and no new memory architecture.
