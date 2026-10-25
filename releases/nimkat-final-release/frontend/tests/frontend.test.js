import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'src');

test('Frontend source tree and core pages exist', () => {
  const required = [
    'App.jsx',
    'main.jsx',
    'api.js',
    'auth.jsx',
    'pages/Home.jsx',
    'pages/ClassesSearch.jsx',
    'pages/ClassDetail.jsx',
    'pages/TeacherProfile.jsx',
    'pages/Login.jsx',
    'pages/panel/StudentHome.jsx',
    'pages/panel/TeacherHome.jsx',
    'pages/panel/Chat.jsx',
    'pages/panel/Club.jsx',
  ];
  for (const rel of required) {
    assert.ok(fs.existsSync(path.join(srcDir, rel)), `Missing ${rel}`);
  }
});
