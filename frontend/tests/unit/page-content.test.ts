import { describe, it, expect } from 'vitest';
import specs from '../../src/blocks/native/specs.json';

describe('editorial contracts for stateful page widgets', () => {
  for (const [name, spec] of Object.entries(specs)) {
    it(`${name}: every inspector field has a default and unique key`, () => {
      expect(new Set(spec.fields.map((f) => f.key)).size).toBe(spec.fields.length);
      for (const field of spec.fields) expect(spec.defaults).toHaveProperty(field.key);
    });
    it(`${name}: no financial or identity fields exposed to the editor`, () => {
      for (const field of spec.fields) {
        expect(field.key).not.toMatch(/price|balance|capacity|classId|teacherId|wallet|commission|discount/i);
        expect(['text', 'textarea']).toContain(field.type);
      }
    });
  }
});
