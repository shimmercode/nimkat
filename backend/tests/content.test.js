const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validSchema } = require('../src/modules/content/schema');
const node = (id, children = []) => ({ id, type: 'page', props: {}, children });
test('content schema accepts bounded trees', () => assert.equal(validSchema({ root: node('root', [node('child')]) }), true));
test('content schema rejects duplicate IDs', () => assert.equal(validSchema({ root: node('root', [node('root')]) }), false));
test('content schema rejects malformed roots', () => {
  for (const value of [null, {}, [], { root: {} }, { root: { ...node('root'), type: 'text' } }]) assert.equal(validSchema(value), false);
});
test('content schema rejects malformed children and props', () => {
  assert.equal(validSchema({ root: node('root', {}) }), false);
  assert.equal(validSchema({ root: { ...node('root'), props: [] } }), false);
});
test('content schema bounds recursion and node count', () => {
  let root = node('0'); let cursor = root;
  for (let i = 1; i < 33; i++) { const child = node(String(i)); cursor.children = [child]; cursor = child; }
  assert.equal(validSchema({ root }), false);
  assert.equal(validSchema({ root: node('root', Array.from({ length: 3001 }, (_, i) => node(`n${i}`))) }), false);
});
