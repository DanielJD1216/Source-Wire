# Source-Wire Contribution Policy

Status: policy boundary, not contribution acceptance.

Source-Wire is Apache-2.0 licensed and can be reused as a source package. Public code contributions are not accepted yet.

## Current Accepted Input

Public feedback is accepted through structured issues only:

- verification failures,
- docs or contract feedback,
- boundary or safety concerns.

Use issues instead of pull requests for public feedback.

## Current Blocked Input

Do not submit:

- public code pull requests,
- production runtime implementations,
- hosted runtime behavior,
- database migrations,
- live connector code,
- package publishing changes,
- GitHub release or tag changes,
- private data,
- real user records,
- real chat logs,
- client names,
- account IDs,
- secrets,
- local private paths,
- private screenshots,
- copied private docs.

## Future Contribution Posture

If Source-Wire later opens public code contributions, the preferred path is DCO-based contribution, not CLA-based contribution.

That future path is not active yet. It would require:

- explicit owner approval,
- updated `CONTRIBUTING.md`,
- updated pull request template,
- Apache-2.0-compatible inbound contribution terms,
- maintainer review,
- Package Checks,
- public-safety scan,
- private-data exclusion confirmation,
- clear close conditions.

## Private-Data Exclusion

Any future contribution path must reject:

- secrets or tokens,
- local private paths,
- production exports,
- account IDs,
- client names,
- private screenshots,
- real source payloads,
- real chat logs,
- real memory records,
- private implementation history.

Synthetic examples and public repo references are allowed.

## Maintainer Review Policy

If contribution acceptance opens later, maintainers should require:

- one maintainer review before merge,
- passing Package Checks,
- docs updates when public behavior changes,
- no private data,
- no new hosted runtime behavior unless separately approved,
- no release-channel changes unless separately approved,
- no license incompatibility.

Maintainers may close contributions that skip the public issue-feedback path, include private data, add blocked runtime scope, weaken safety boundaries, or do not include enough verification.

## Support Expectations

Source-Wire maintainers may review structured feedback and future accepted PRs.

Maintainers do not promise:

- production support,
- hosted runtime support,
- custom implementation support,
- emergency response for source-package use,
- help migrating private data.

## Security Report Scope

Until hosted runtime exists, security reports are in scope when they involve:

- package contents,
- docs claims,
- private-data leakage,
- fixture leakage,
- unsafe contribution intake,
- runtime-boundary examples.

Hosted service vulnerabilities are out of scope until a hosted service exists.

## License Compatibility

Future inbound contributions must be compatible with Apache-2.0.

Do not contribute copied code, unclear-provenance code, private code, or code under licenses that conflict with Apache-2.0 distribution.

## Current Boundary

Contribution terms are defined for planning.

Code contribution acceptance remains blocked.
