import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseDir = path.join(root, 'release');

function isProcessRunning(name) {
  const result = spawnSync('tasklist', ['/FI', `IMAGENAME eq ${name}`, '/NH'], {
    shell: true,
    encoding: 'utf8',
  });
  return result.stdout?.toLowerCase().includes(name.toLowerCase());
}

if (process.platform === 'win32' && isProcessRunning('Seung.exe')) {
  console.error(
    '\nBuild blocked: Seung.exe is still running.\nClose the Seung desktop app, then run npm run desktop:build again.\n'
  );
  process.exit(1);
}

const lockedFiles = [
  path.join(releaseDir, 'Seung Setup 0.1.0.exe'),
  path.join(releaseDir, 'win-unpacked', 'Seung.exe'),
];

for (const filePath of lockedFiles) {
  if (!fs.existsSync(filePath)) continue;
  try {
    fs.renameSync(filePath, filePath);
  } catch {
    console.error(
      `\nBuild blocked: "${filePath}" is locked.\nClose Seung.exe and any installer windows, then retry.\n`
    );
    process.exit(1);
  }
}

const iconScript = path.join(root, 'scripts', 'generate-desktop-icon.mjs');
spawnSync(process.execPath, [iconScript], { stdio: 'inherit', cwd: root });

const compile = spawnSync('npm', ['run', 'desktop:compile'], {
  stdio: 'inherit',
  cwd: root,
  shell: true,
});
if (compile.status !== 0) process.exit(compile.status ?? 1);

const build = spawnSync('npx', ['electron-builder', '--project', 'desktop'], {
  stdio: 'inherit',
  cwd: root,
  shell: true,
});
process.exit(build.status ?? 1);
