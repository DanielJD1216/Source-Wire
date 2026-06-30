# Source-Wire Support

Source-Wire is public for technical review only.

It is not licensed for reuse, not published to npm, not released, and not a hosted runtime.

## Supported Questions

Use GitHub issues for:

- verification failures,
- docs or contract feedback,
- boundary or safety concerns.

Start with:

- [Public Status](docs/public-status.md)
- [Technical Reviewer Guide](docs/technical-reviewer-guide.md)
- [Reviewer Feedback Guide](docs/reviewer-feedback-guide.md)

## Not Supported Yet

Source-Wire does not currently support:

- production usage,
- npm installation from the registry,
- hosted runtime setup,
- MCP server runtime setup,
- database setup,
- connector setup,
- real data imports,
- private implementation support,
- migration from private systems,
- code contribution acceptance.

## Safe Support Boundary

Do not include:

- secrets,
- tokens,
- private data,
- local private paths,
- private screenshots,
- production exports,
- account IDs,
- client names,
- real source payloads,
- real chat logs,
- real memory records.

Use synthetic examples or public repo references only.

## Verification First

Before opening a verification issue, run:

```bash
npm install
npm run publish:readiness
```

Despite the command name, this does not publish npm.

If it fails, use the Verification failure issue template.
