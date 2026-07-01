import { execFile } from "node:child_process";

const repo = "DanielJD1216/Source-Wire";

const expectedOpenIssues = [
  {
    number: 255,
    title: "Owner decision: approve first public release path"
  },
  {
    number: 256,
    title: "Owner decision: approve branch governance path"
  },
  {
    number: 257,
    title: "Owner decision: open hosted runtime PRD path"
  },
  {
    number: 258,
    title: "Owner decision: define contribution terms before accepting code"
  }
];

const issues = await ghJson([
  "issue",
  "list",
  "--repo",
  repo,
  "--state",
  "open",
  "--limit",
  "100",
  "--json",
  "number,title,state,url"
]);

const expectedByNumber = new Map(expectedOpenIssues.map((issue) => [issue.number, issue]));
const actualByNumber = new Map(issues.map((issue) => [issue.number, issue]));
const failures = [];

for (const expectedIssue of expectedOpenIssues) {
  const actualIssue = actualByNumber.get(expectedIssue.number);
  if (!actualIssue) {
    failures.push(`missing open owner decision issue #${expectedIssue.number}: ${expectedIssue.title}`);
    continue;
  }

  if (actualIssue.title !== expectedIssue.title) {
    failures.push(`unexpected title for #${expectedIssue.number}: expected "${expectedIssue.title}", received "${actualIssue.title}"`);
  }
}

for (const actualIssue of issues) {
  if (!expectedByNumber.has(actualIssue.number)) {
    failures.push(`unexpected open issue #${actualIssue.number}: ${actualIssue.title}`);
  }
}

printSection("Source-Wire Owner Open Issues Status");
console.log("This owner-side status check is read-only.");
console.log("It verifies that the public open issue surface is limited to tracked owner-decision gates.");
console.log("It does not close issues, create issues, publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, or approve hosted runtime use.");

printSection("Open Issues");
if (issues.length === 0) {
  console.log("No open issues found.");
} else {
  for (const issue of issues.toSorted((left, right) => left.number - right.number)) {
    console.log(`#${issue.number} ${issue.title}`);
    console.log(`URL: ${issue.url}`);
  }
}

printSection("Owner Open Issues Result");
console.log("ok owner open issue boundary readable");

if (failures.length > 0) {
  for (const failure of failures) {
    console.log(`failed ${failure}`);
  }
  process.exit(1);
}

console.log("ok only owner decision issues open");
for (const issue of expectedOpenIssues) {
  console.log(`blocked #${issue.number} ${issue.title}`);
}
console.log("blocked owner decisions remain open");

function ghJson(args) {
  return new Promise((resolve, reject) => {
    execFile("gh", args, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`gh ${args.join(" ")} failed\n${stderr || error.message}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (parseError) {
        reject(new Error(`Unable to parse gh JSON: ${parseError.message}`));
      }
    });
  });
}

function printSection(title) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
}
