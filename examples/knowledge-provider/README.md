# KnowledgeProvider Conformance Smoke

Use Node.js 22 with npm for local checks. See the [Quickstart](../../docs/getting-started/quickstart.md).

This example loads the synthetic `KnowledgeProvider v1` fixture matrix and evaluates both provider profiles through one exported evaluator.

From the repository root:

```bash
npm run runtime:knowledge-provider-smoke
```

Expected output includes exactly 37 unique `ok knowledge provider case` markers and ends with:

```text
ok knowledge provider conformance smoke
```

The smoke proves contract behavior only. It does not connect to a knowledge base, load a provider SDK, use credentials, mutate a source, or create trusted memory.

Related docs:

- [KnowledgeProvider v1 Contract](../../docs/contracts/knowledge-provider-v1-contract.md)
- [KnowledgeProvider Smoke](../../docs/reference/knowledge-provider-smoke.md)
