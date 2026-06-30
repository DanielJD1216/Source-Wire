const blockedCommandChecks = [
  {
    pattern: /\bnpm\s+publish\b/u,
    describe: (scriptName) => `script ${scriptName} includes npm publish`
  },
  {
    pattern: /\bgh\s+release\b/u,
    describe: (scriptName) => `script ${scriptName} includes gh release`
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
