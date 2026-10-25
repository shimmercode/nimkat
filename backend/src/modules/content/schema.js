/* Bounded structural validation, shared by the content write endpoints. */
function validSchema(schema) {
  if (!schema || !schema.root || schema.root.type !== 'page') return false;
  const ids = new Set();
  const allowed=new Set(['page','section','layout','blog-feed','heading','text','image','buttons','divider','spacer','cta-band','hero','booking-steps','stats-band','top-teachers','top-students','group-classes','club-band','promo-duo','testimonials','magazine','faq','callback','classes-search','teacher-profile','class-detail','club-dashboard']);
  function safe(value,depth=0){if(depth>30)return false;if(typeof value==='string')return value.length<=50000;if(Array.isArray(value))return value.length<=1000&&value.every(x=>safe(x,depth+1));if(value&&typeof value==='object')return Object.entries(value).every(([k,v])=>!['__proto__','prototype','constructor'].includes(k)&&(!['src','href'].includes(k)||typeof v!=='string'||!v||/^(https:\/\/|\/(?!\/)|#|mailto:|tel:)/i.test(v))&&safe(v,depth+1));return value===null||['number','boolean'].includes(typeof value);}

  let count = 0;
  const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
  function visit(node, depth) {
    if (!object(node) || depth > 30 || ++count > 3000) return false;
    if (typeof node.id !== 'string' || !node.id || ids.has(node.id)) return false;
    ids.add(node.id);
    if(!allowed.has(node.type)||!safe(node.props))return false;
    if(node.style){if(!object(node.style))return false;for(const [bp,values] of Object.entries(node.style)){if(!['desktop','tablet','mobile'].includes(bp)||!object(values))return false;for(const [k,v] of Object.entries(values)){if(k==='fontFamily'||typeof v==='object'||!['number','string'].includes(typeof v)||/[{};<>@]|url\s*\(/i.test(String(v))||String(v).length>250||typeof v==='number'&&(!Number.isFinite(v)||Math.abs(v)>10000)||k==='fontSize'&&v!==''&&(Number(v)<12||Number(v)>512))return false;}}}
    if (typeof node.type !== 'string' || !node.type || !object(node.props)) return false;
    if (node.children !== undefined && !Array.isArray(node.children)) return false;
    return (node.children || []).every((child) => visit(child, depth + 1));
  }
  return visit(schema.root, 0);
}
module.exports = { validSchema };
