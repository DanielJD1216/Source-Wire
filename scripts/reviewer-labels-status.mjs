import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";

const repo = "DanielJD1216/Source-Wire";
const shouldEnsure = process.argv.includes("--ensure");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));

const expectedLabels = [
  {
    name: "reviewer-feedback",
    color: "5319e7",
    description: "Structured public reviewer feedback for Source-Wire."
  },
  {
    name: "verification",
    color: "0e8a16",
    description: "A documented Source-Wire command or readiness marker failed."
  },
  {
    name: "docs",
    color: "0075ca",
    description: "Public docs, examples, schemas, or contract wording feedback."
  },
  {
    name: "contracts",
    color: "1d76db",
    description: "Source-Wire contracts, schemas, fixtures, or API surface feedback."
  },
  {
    name: "boundary",
    color: "fbca04",
    description: "License, release, runtime, data, or product boundary concern."
  },
  {
    name: "safety",
    color: "d93f0b",
    description: "Privacy, private-data, security, or unsafe claim concern."
  }
];

assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted");

printSection("Source-Wire Reviewer Labels Status");
console.log("This owner-side check verifies GitHub labels used by public issue templates.");
console.log("Default mode is read-only. With --ensure, it creates or updates only reviewer-intake labels.");
console.log("It does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.");

if (shouldEnsure) {
  await ensureLabels();
}

const liveLabels = await getLabels();
const failures = [];
const rows = [];

for (const expectedLabel of expectedLabels) {
  const liveLabel = liveLabels.get(expectedLabel.name);
  const present = Boolean(liveLabel);
  const colorMatches = normalizeColor(liveLabel?.color ?? "") === normalizeColor(expectedLabel.color);
  const descriptionMatches = (liveLabel?.description ?? "") === expectedLabel.description;

  if (!present) {
    failures.push(`missing reviewer label: ${expectedLabel.name}`);
  } else {
    if (!colorMatches) {
      failures.push(`reviewer label ${expectedLabel.name} color mismatch: expected ${expectedLabel.color}, received ${liveLabel.color}`);
    }
    if (!descriptionMatches) {
      failures.push(`reviewer label ${expectedLabel.name} description mismatch`);
    }
  }

  rows.push([
    expectedLabel.name,
    present ? "present" : "missing",
    present && colorMatches ? "ok" : "mismatch",
    present && descriptionMatches ? "ok" : "mismatch"
  ]);
}

if (failures.length > 0) {
  console.error("failed reviewer labels status");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  console.error("next action: run npm run reviewer:labels:ensure with owner GitHub permissions");
  process.exit(1);
}

printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Mode", shouldEnsure ? "ensure" : "read-only"],
  ["Reviewer labels", `${expectedLabels.length} expected labels present`],
  ["Code contributions", "blocked"]
]);

printSection("Reviewer Label Details");
for (const [label, status, color, description] of rows) {
  console.log(`${label}: ${status}, color=${color}, description=${description}`);
}

console.log("");
console.log("ok reviewer labels status ready");
console.log("ok reviewer feedback labels current");
console.log("blocked contribution acceptance");

async function ensureLabels() {
  const liveLabels = await getLabels();
  for (const expectedLabel of expectedLabels) {
    if (liveLabels.has(expectedLabel.name)) {
      await run("gh", [
        "label",
        "edit",
        expectedLabel.name,
        "--repo",
        repo,
        "--color",
        expectedLabel.color,
        "--description",
        expectedLabel.description
      ]);
      continue;
    }

    await run("gh", [
      "label",
      "create",
      expectedLabel.name,
      "--repo",
      repo,
      "--color",
      expectedLabel.color,
      "--description",
      expectedLabel.description
    ]);
  }
}

async function getLabels() {
  const labels = await ghJson([
    "label",
    "list",
    "--repo",
    repo,
    "--json",
    "name,color,description",
    "--limit",
    "200"
  ]);

  return new Map(labels.map((label) => [label.name, label]));
}

function ghJson(args) {
  return run("gh", args, { maxBuffer: 1024 * 1024 * 10 }).then((result) => JSON.parse(result.stdout));
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      {
        cwd: process.cwd(),
        maxBuffer: options.maxBuffer ?? 1024 * 1024 * 10
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`${command} ${args.join(" ")} failed\n${stderr || error.message}`));
          return;
        }

        resolve({ stdout, stderr });
      }
    );
  });
}

function assertEqual(actual, expected, reason) {
  if (actual !== expected) {
    throw new Error(`${reason}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function normalizeColor(color) {
  return color.replace(/^#/u, "").toLowerCase();
}

function printSection(title) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
}

function printRows(rows) {
  const labelWidth = Math.max(...rows.map(([label]) => label.length));
  for (const [label, value] of rows) {
    console.log(`${label.padEnd(labelWidth)}: ${value}`);
  }
}
