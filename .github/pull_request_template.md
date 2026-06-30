# Source-Wire Pull Request Boundary

Source-Wire is Apache-2.0 licensed as a source package, but code contributions are not accepted yet.

Before opening this pull request, confirm this is one of the currently allowed paths:

- documentation or contract review prepared by the owner,
- repository-boundary maintenance prepared by the owner,
- explicit owner-approved public-readiness work,
- a test-only verification branch created by the owner.

For public review feedback, use issues instead:

- verification failure,
- docs or contract feedback,
- boundary or safety concern.

Do not include:

- secrets,
- tokens,
- private data,
- local private paths,
- production exports,
- account IDs,
- client names,
- private screenshots,
- real source payloads,
- real chat logs,
- real memory records.

This pull request does not approve:

- code contribution acceptance,
- npm publishing,
- GitHub release publishing,
- release tags,
- package version changes,
- deployment,
- hosted runtime behavior,
- production runtime claims,
- real user data,
- trusted Memory Record auto-promotion.

## Checklist

- [ ] I understand Source-Wire is not accepting public code contributions yet.
- [ ] I did not include secrets, private data, local private paths, production exports, account IDs, client names, private screenshots, real source payloads, real chat logs, or real memory records.
- [ ] I did not add npm publishing, GitHub release publishing, release tags, deployment, hosted runtime behavior, production runtime claims, or code contribution acceptance.
- [ ] I ran `npm run publish:readiness` or explain why this pull request is docs-only and owner-approved.
