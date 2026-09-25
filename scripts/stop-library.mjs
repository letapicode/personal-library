import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createInstanceId, probeLibraryPort } from './library-port.mjs';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const address = 'http://127.0.0.1:3000';

const state = await probeLibraryPort(address, createInstanceId(projectRoot));
if (state === 'free') {
  console.log('[OK] Library is not running on port 3000.');
} else if (state !== 'ours') {
  console.error('[ERROR] Port 3000 belongs to another application or Library checkout. Nothing was stopped.');
  process.exitCode = 1;
} else {
  try {
    const { stdout } = await execFileAsync('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-Command',
      "$listener = Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort 3000 -State Listen -ErrorAction Stop | Select-Object -First 1; " +
      '$owner = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)"; ' +
      '[pscustomobject]@{ pid = $owner.ProcessId; commandLine = $owner.CommandLine } | ConvertTo-Json -Compress'
    ], { windowsHide: true });
    const owner = JSON.parse(stdout);
    const commandLine = String(owner.commandLine || '').toLowerCase();
    if (!Number.isInteger(owner.pid) || !commandLine.includes(projectRoot.toLowerCase()) ||
        !commandLine.includes('vite')) {
      throw new Error('The port owner no longer matches this checkout’s Vite process.');
    }
    if (process.env.LIBRARY_STOP_DRY_RUN === '1') {
      console.log(`[OK] Would stop this Library's Vite process (PID ${owner.pid}).`);
    } else {
      process.kill(owner.pid);
      console.log('[OK] Stopped this Library server on port 3000.');
    }
  } catch (error) {
    console.error('[ERROR] Could not safely stop the Library server:', error.message);
    process.exitCode = 1;
  }
}
