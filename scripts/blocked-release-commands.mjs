const blockedCommandChecks = [
  {
    pattern: /\b(?:npm|pnpm|yarn)\s+publish\b/u,
    describe: (scriptName) => `script ${scriptName} includes package publish`
  },
  {
    pattern: /\bgh\s+release\b/u,
    describe: (scriptName) => `script ${scriptName} includes gh release`
  },
  {
    pattern: /\bgit\s+tag\b/u,
    describe: (scriptName) => `script ${scriptName} includes git tag`
  },
  {
    pattern: /\bgit\s+push\b[^&|;]*--tags\b/u,
    describe: (scriptName) => `script ${scriptName} includes git push --tags`
  },
  {
    pattern: /\b(?:npm|pnpm|yarn)\s+version\b/u,
    describe: (scriptName) => `script ${scriptName} includes package version change`
  },
  {
    pattern: /\b(?:vercel|netlify|wrangler|flyctl|railway)\s+(?:deploy|publish|up)\b/u,
    describe: (scriptName) => `script ${scriptName} includes service deployment`
  }
];

export function assertNoBlockedReleaseCommands(scripts, failures) {
  for (const [scriptName, scriptValue] of Object.entries(scripts ?? {})) {
    for (const check of blockedCommandChecks) {
      if (check.pattern.test(scriptValue)) {
        failures.push(check.describe(scriptName));
      }
    }
  }
}
