import { spawn } from 'node:child_process';

/** Ask the Windows default URL handler to open a local page, then await dispatch. */
export function openDefaultBrowser(address, spawnProcess = spawn) {
  return new Promise(resolve => {
    // rundll32 invokes the registered HTTP handler directly. Passing the URL as
    // its own argument avoids cmd.exe's nested quoting of `start "" "..."`.
    const opener = spawnProcess('rundll32.exe', ['url.dll,FileProtocolHandler', address], {
      stdio: 'inherit',
      windowsHide: false
    });
    opener.once('error', error => {
      console.error('[ERROR] Could not invoke the default browser:', error.message);
      resolve(false);
    });
    opener.once('exit', code => {
      if (code !== 0) console.error(`[ERROR] Default browser launch failed (exit code ${code}).`);
      resolve(code === 0);
    });
  });
}
