import { readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
const path = process.argv[2];
if (path) {
  const text = readFileSync(path, 'utf8');
  const line = text.split('\n').find((l) => l.startsWith('ZHIPU_API_KEY='));
  if (!line) throw new Error('ZHIPU_API_KEY not found');
  const value = line
    .slice(line.indexOf('=') + 1)
    .trim()
    .replace(/^['"]|['"]$/g, '');
  if (!value) throw new Error('Empty model key');
  writeFileSync(
    new URL('../.dev.vars', import.meta.url),
    'ZHIPU_API_KEY=' +
      JSON.stringify(value) +
      '\nPROOFLENS_SERVICE_CAP_USD=3\n',
    { mode: 0o600 },
  );
}
const child = spawn('npm', ['run', 'dev'], {
  cwd: new URL('..', import.meta.url),
  stdio: 'inherit',
});
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => child.kill(signal));
child.on('exit', (code) => process.exit(code ?? 0));
