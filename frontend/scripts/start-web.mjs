import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const nextBin = path.join(frontendRoot, 'node_modules', '.bin', 'next');

const primaryPort = Number(process.env.PORT || 5173);
const mirrorPort = Number(process.env.MIRROR_PORT || 3000);

const nextProc = spawn(nextBin, ['start', '--hostname', '0.0.0.0', '--port', String(primaryPort)], {
  cwd: frontendRoot,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' },
});

if (mirrorPort && mirrorPort !== primaryPort) {
  const proxy = http.createServer((req, res) => {
    const proxyReq = http.request(
      {
        hostname: '127.0.0.1',
        port: primaryPort,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: `127.0.0.1:${primaryPort}` },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      }
    );
    proxyReq.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Starting Nimkat frontend...');
    });
    req.pipe(proxyReq, { end: true });
  });
  proxy.listen(mirrorPort, '0.0.0.0', () => {
    console.log(`Nimkat Website mirror listening on http://0.0.0.0:${mirrorPort} -> :${primaryPort}`);
  });
}

nextProc.on('exit', (code) => process.exit(code ?? 0));
