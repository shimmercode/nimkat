/* Bounded structural validation, shared by the content write endpoints. */
function validSchema(schema) {
  if (!schema || !schema.root || schema.root.type !== 'page') return false;
  const ids = new Set();
  let count = 0;
  const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
  function visit(node, depth) {
    if (!object(node) || depth > 30 || ++count > 3000) return false;
    if (typeof node.id !== 'string' || !node.id || ids.has(node.id)) return false;
    ids.add(node.id);
    if (typeof node.type !== 'string' || !node.type || !object(node.props)) return false;
    if (node.children !== undefined && !Array.isArray(node.children)) return false;
    return (node.children || []).every((child) => visit(child, depth + 1));
  }
  return visit(schema.root, 0);
}
module.exports = { validSchema };
