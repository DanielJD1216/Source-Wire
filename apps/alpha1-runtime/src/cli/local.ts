#!/usr/bin/env node

import { renderLocalCliResult } from "../local-cli/result.js";
import { runSourceWireLocalCli } from "../local-cli/runner.js";

const execution = await runSourceWireLocalCli(process.argv.slice(2));
const output = renderLocalCliResult(execution.result, execution.format);

if (execution.result.ok || execution.format === "json") {
  process.stdout.write(output);
} else {
  process.stderr.write(output);
}
process.exitCode = execution.exitCode;
