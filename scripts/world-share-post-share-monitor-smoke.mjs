import { spawnSync } from "node:child_process";

const cases = [
  {
    fixture: "reviewer-feedback-open",
    expectedStatus: 0,
    markers: [
      "Fixture mode: reviewer-feedback-open",
      "Open reviewer feedback issues: 1",
      "ok post-share monitor ready",
      "ok structured reviewer issue intake current"
    ]
  },
  {
    fixture: "owner-decision-open",
    expectedStatus: 1,
    markers: [
      "Fixture mode: owner-decision-open",
      "Open owner-decision issues   : 1",
      "failed owner-decision issue #255 is open but completed owner-decision issues must stay closed"
    ]
  },
  {
    fixture: "unstructured-open",
    expectedStatus: 1,
    markers: [
      "Fixture mode: unstructured-open",
      "failed open issue #901 is not a tracked owner decision issue and lacks reviewer-feedback",
      "failed open reviewer issue #901 lacks a topic label"
    ]
  },
  {
    fixture: "pull-request-open",
    expectedStatus: 1,
    markers: [
      "Fixture mode: pull-request-open",
      "Open pull requests           : 1",
      "failed open pull request #12 exists while code contributions are blocked"
    ]
  }
];

for (const testCase of cases) {
  const result = spawnSync(
    process.execPath,
    ["scripts/world-share-post-share-monitor.mjs", "--fixture", testCase.fixture],
    {
      cwd: process.cwd(),
      encoding: "utf8"
    }
  );
  const output = `${result.stdout}\n${result.stderr}`;

  if (result.status !== testCase.expectedStatus) {
    console.error(`failed post-share monitor smoke fixture ${testCase.fixture}: expected status ${testCase.expectedStatus}, received ${result.status}`);
    console.error(output);
    process.exit(1);
  }

  for (const marker of testCase.markers) {
    if (!output.includes(marker)) {
      console.error(`failed post-share monitor smoke fixture ${testCase.fixture}: missing marker ${JSON.stringify(marker)}`);
      console.error(output);
      process.exit(1);
    }
  }
}

console.log("ok post-share monitor smoke");
