const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const fs = require('node:fs');

const frontendDir = path.resolve(__dirname, '..');
const embeddedBackendDir = path.resolve(frontendDir, '.backend-runtime');
const repoBackendDir = path.resolve(frontendDir, '..', 'backend');

if (fs.existsSync(path.join(repoBackendDir, 'src', 'server.js'))) {
  try {
    require('./prepare-embedded-backend.cjs');
  } catch (err) {
    console.warn('[Nimkat] Could not copy backend runtime:', err.message);
  }
}

const activeBackendDir = fs.existsSync(path.join(embeddedBackendDir, 'src', 'server.js'))
  ? embeddedBackendDir
  : repoBackendDir;
const backendEntry = path.join(activeBackendDir, 'src', 'server.js');
const nextBin = path.join(frontendDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const frontendPort = String(process.env.PORT || '5173');
const backendPort = Number(process.env.BACKEND_INTERNAL_PORT || 8000);

function isPortListening(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(600);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function waitForBackendReady(port, maxWaitMs = 10000) {
  const start = Date.now();
  return new Promise((resolve) => {
    const check = async () => {
      if (await isPortListening(port)) {
        resolve(true);
        return;
      }
      if (Date.now() - start >= maxWaitMs) {
        resolve(false);
        return;
      }
      setTimeout(check, 200);
    };
    check();
  });
}

async function main() {
  let localBackendUp = await isPortListening(backendPort);
  if (!localBackendUp && fs.existsSync(backendEntry) && Number(frontendPort) !== backendPort) {
    const nodePaths = [
      path.join(frontendDir, 'node_modules'),
      path.join(repoBackendDir, 'node_modules'),
      process.env.NODE_PATH || '',
    ]
      .filter(Boolean)
      .join(path.delimiter);

    console.log(`[Nimkat] Starting embedded API backend from ${backendEntry} on 127.0.0.1:${backendPort}...`);
    const backendProc = spawn(process.execPath, [backendEntry], {
      cwd: activeBackendDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: String(backendPort),
        BIND_HOST: '127.0.0.1',
        NODE_ENV: process.env.NIMKAT_STRICT_PRODUCTION === 'true' ? 'production' : 'development',
        TRUST_PROXY: '1',
        NODE_PATH: nodePaths,
      },
    });
    backendProc.on('error', (err) => {
      console.error('[Nimkat] Embedded backend error:', err.message);
    });
    localBackendUp = await waitForBackendReady(backendPort, 8000);
    console.log(`[Nimkat] Embedded API backend ready: ${localBackendUp}`);
  }

  const nextEnv = { ...process.env };
  if (localBackendUp) {
    nextEnv.API_INTERNAL_URL = `http://127.0.0.1:${backendPort}`;
  }

  const nextProc = spawn(
    process.execPath,
    [nextBin, 'start', '--hostname', '0.0.0.0', '--port', frontendPort],
    {
      cwd: frontendDir,
      stdio: 'inherit',
      env: nextEnv,
    }
  );

  nextProc.on('exit', (code) => process.exit(code || 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
