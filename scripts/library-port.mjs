import { createHash } from 'node:crypto';
import { get } from 'node:http';
import path from 'node:path';

export function createInstanceId(projectRoot) {
  return createHash('sha256').update(path.resolve(projectRoot).toLowerCase()).digest('hex');
}

/** Only this checkout's Vite health response is safe to reuse as the Library tab. */
export function probeLibraryPort(address, expectedInstanceId) {
  return new Promise(resolve => {
    const request = get(`${address}/__library-health`, { timeout: 800 }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        body += chunk;
        if (body.length > 4096) response.destroy(new Error('Unexpected health response'));
      });
      response.on('error', () => resolve('occupied'));
      response.on('end', () => {
        try {
          const health = JSON.parse(body);
          resolve(response.statusCode === 200 && health.app === 'personal-library' &&
            health.instanceId === expectedInstanceId ? 'ours' : 'occupied');
        } catch {
          resolve('occupied');
        }
      });
    });
    request.on('timeout', () => request.destroy(new Error('Probe timed out')));
    request.on('error', error => resolve(error.code === 'ECONNREFUSED' ? 'free' : 'occupied'));
  });
}
