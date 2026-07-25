#!/usr/bin/env node

import {
  localCliFailure,
  renderLocalCliResult
} from "../local-cli/result.js";
import { runLocalMcpStdio } from "../local-cli/mcp-stdio.js";
import { runSourceWireLocalCli } from "../local-cli/runner.js";

const args = process.argv.slice(2);

if (args[0] === "mcp" && args[1] === "stdio") {
  try {
    process.exitCode = await runLocalMcpStdio(args.slice(2));
  } catch (error) {
    process.stderr.write(
      renderLocalCliResult(
        localCliFailure("local.mcp.stdio", error),
        "human"
      )
    );
    process.exitCode = 1;
  }
} else {
  const execution = await runSourceWireLocalCli(args);
  const output = renderLocalCliResult(execution.result, execution.format);

  if (execution.result.ok || execution.format === "json") {
    process.stdout.write(output);
  } else {
    process.stderr.write(output);
  }
  process.exitCode = execution.exitCode;
}
