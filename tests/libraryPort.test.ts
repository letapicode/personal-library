import { createServer } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { createInstanceId, probeLibraryPort } from '../scripts/library-port.mjs';

const servers: ReturnType<typeof createServer>[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))));
});

describe('Library launcher port ownership', () => {
  it('reuses only this checkout and rejects a different owner on the same port', async () => {
    const ownId = createInstanceId('C:/Library');
    let response = { app: 'personal-library', instanceId: ownId };
    const server = createServer((_request, reply) => {
      reply.setHeader('Content-Type', 'application/json');
      reply.end(JSON.stringify(response));
    });
    servers.push(server);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const addressInfo = server.address();
    if (!addressInfo || typeof addressInfo === 'string') throw new Error('Missing TCP port');
    const address = `http://127.0.0.1:${addressInfo.port}`;

    expect(await probeLibraryPort(address, ownId)).toBe('ours');
    response = { app: 'personal-library', instanceId: createInstanceId('C:/AnotherLibrary') };
    expect(await probeLibraryPort(address, ownId)).toBe('occupied');
    response = { app: 'unrelated-app', instanceId: ownId };
    expect(await probeLibraryPort(address, ownId)).toBe('occupied');
  });
});
