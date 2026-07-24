# Reviewer Labels

Status: owner-side GitHub metadata check.

Use this page to verify that public issue templates can apply the labels they declare.

## Quickstart

Prerequisites:

- Node.js 22 or newer.
- Run `npm install` from the Source-Wire repo root.
- GitHub CLI authenticated with permission to read labels in `DanielJD1216/Source-Wire`.

Read-only check:

```bash
npm run reviewer:labels
```

Owner-side repair:

```bash
npm run reviewer:labels:ensure
```

## Expected Labels

The reviewer issue templates use these labels:

- `reviewer-feedback`
- `verification`
- `docs`
- `contracts`
- `boundary`
- `safety`

## Output Markers

Expected successful markers:

```text
ok reviewer labels status ready
ok reviewer feedback labels current
blocked contribution acceptance
```

## Boundaries

`npm run reviewer:labels` is read-only.

`npm run reviewer:labels:ensure` creates or updates only the reviewer-intake labels above.

Neither command publishes npm, creates a GitHub release, creates tags, changes package version, deploys services, enables branch governance, accepts code contributions, implements hosted runtime behavior, or approves production runtime use.

The labels support structured public feedback. They do not open public code contribution acceptance.
