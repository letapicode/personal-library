import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDefaultBrowser } from './browser-launcher.mjs';
import { createInstanceId, probeLibraryPort } from './library-port.mjs';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const instanceId = createInstanceId(projectRoot);
const address = 'http://127.0.0.1:3000';

async function openBrowser() {
  if (process.env.LIBRARY_LAUNCHER_NO_BROWSER === '1') return true;
  return openDefaultBrowser(address);
}

const initialState = await probeLibraryPort(address, instanceId);
if (initialState === 'occupied') {
  console.error('[ERROR] Port 3000 is in use by another application or an unrecognized Library server.');
  console.error('Close the application on port 3000, then run Das Library again. No browser page was opened.');
  process.exitCode = 1;
} else if (initialState === 'ours') {
  console.log('[OK] This Library is already running on port 3000.');
  console.log(`[INFO] Opening ${address} in your Windows default browser...`);
  if (await openBrowser()) {
    console.log('[OK] The browser was requested. This launcher can close; the existing server stays running.');
  } else {
    console.error(`[ERROR] Open ${address} manually. This Library server is still running.`);
    process.exitCode = 1;
  }
} else {
  console.log('[INFO] Starting this Library on port 3000...');
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], {
    cwd: projectRoot,
    stdio: 'inherit'
  });
  let exited = false;
  let spawnError = null;
  const exitPromise = new Promise(resolve => server.once('exit', code => {
    exited = true;
    resolve(code);
  }));
  server.once('error', error => {
    spawnError = error;
    exited = true;
    console.error('[ERROR] Could not start Vite:', error.message);
  });

  let ready = false;
  for (let attempt = 0; attempt < 120 && !exited; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 250));
    const state = await probeLibraryPort(address, instanceId);
    if (state === 'ours') {
      ready = true;
      break;
    }
    if (state === 'occupied') break;
  }

  if (!ready) {
    if (!spawnError) console.error('[ERROR] Library did not become ready on port 3000. Check the Vite error above.');
    if (!exited) {
      server.kill();
      await exitPromise;
    }
    process.exitCode = 1;
  } else {
    console.log(`[OK] Library is ready at ${address}. Opening your Windows default browser...`);
    if (!await openBrowser()) {
      console.error(`[ERROR] Open ${address} manually. The Library server remains available.`);
    }
    console.log('[INFO] Keep this window open while reading. Press Ctrl+C here to stop the server.');
    process.on('SIGINT', () => server.kill('SIGINT'));
    process.on('SIGTERM', () => server.kill('SIGTERM'));
    await exitPromise;
    process.exitCode = server.exitCode ?? 0;
  }
}
