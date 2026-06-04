import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

let gitSha = 'unknown';
try {
  gitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {
  /* not a git checkout */
}

const info = {
  gitSha,
  builtAt: new Date().toISOString(),
  architectureHidden: true,
  pptHidden: true,
};

writeFileSync('public/build-info.json', `${JSON.stringify(info, null, 2)}\n`);
console.log('Wrote public/build-info.json', info);
