const fs = require('node:fs');
const path = require('node:path');

const frontendDir = path.resolve(__dirname, '..');
const backendSrc = path.resolve(frontendDir, '..', 'backend', 'src');
const runtimeDir = path.resolve(frontendDir, '.backend-runtime');
const targetSrc = path.resolve(runtimeDir, 'src');

if (fs.existsSync(backendSrc)) {
  fs.mkdirSync(targetSrc, { recursive: true });
  fs.cpSync(backendSrc, targetSrc, { recursive: true, force: true });
  fs.writeFileSync(
    path.join(runtimeDir, 'package.json'),
    JSON.stringify({ name: 'nimkat-embedded-backend', private: true, type: 'commonjs' }, null, 2)
  );
  console.log('[Nimkat] Prepared embedded backend runtime in frontend/.backend-runtime/src');
} else {
  console.log('[Nimkat] ../backend/src not found; skipping copy');
}
