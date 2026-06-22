import { spawn } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: path.join(root, '.env') });
loadEnv({ path: path.join(root, 'desktop', '.env') });

const electronBin =
  process.platform === 'win32'
    ? path.join(root, 'node_modules', '.bin', 'electron.cmd')
    : path.join(root, 'node_modules', '.bin', 'electron');

const child = spawn(electronBin, ['desktop/dist/main.js'], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => process.exit(code ?? 0));
