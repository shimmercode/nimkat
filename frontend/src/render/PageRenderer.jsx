/* PageRenderer — renders a page schema (public site + editor canvas) */
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { registry, getIn } from '../blocks/registry.js';

const STYLE_KEYS = ['background', 'backgroundColor', 'color', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
  'marginTop', 'marginBottom', 'borderRadius', 'boxShadow', 'maxWidth', 'gap', 'opacity', 'fontSize', 'fontWeight', 'lineHeight', 'textAlign'];

function styleFor(node, vw) {
  const s = node.style || {};
  const merged = { ...(s.desktop || {}) };
  if (vw <= 900) Object.assign(merged, s.tablet || {});
  if (vw <= 560) Object.assign(merged, s.mobile || {});
  const out = {};
  for (const k of STYLE_KEYS) if (merged[k] !== undefined && merged[k] !== '') out[k] = merged[k];
  return out;
}

function NodeView({ node, vw, edit, selectedId, onSelect }) {
  const spec = registry[node.type];
  if (!spec) return <div style={{ padding: 12, color: '#B42A48' }}>بلوک ناشناخته: {node.type}</div>;
  const Comp = spec.component;
  const style = styleFor(node, vw);

  if (node.type === 'section') {
    return (
      <EditWrap edit={edit} node={node} selectedId={selectedId} onSelect={onSelect}>
        <section className={`pb-section ${node.props.className || ''}`} id={node.props.anchor || undefined} style={style}>
          <div className="container">
            {(node.children || []).map((c) => (
              <NodeView key={c.id} node={c} vw={vw} edit={edit} selectedId={selectedId} onSelect={onSelect} />
            ))}
          </div>
        </section>
      </EditWrap>
    );
  }

  return (
    <EditWrap edit={edit} node={node} selectedId={selectedId} onSelect={onSelect}>
      <div style={style}>
        <Comp node={node} style={style}>
          {(node.children || []).map((c) => (
            <NodeView key={c.id} node={c} vw={vw} edit={edit} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </Comp>
      </div>
    </EditWrap>
  );
}

function EditWrap({ edit, node, selectedId, onSelect, children }) {
  const reduce = useReducedMotion();
  if (!edit) return <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.05 }} transition={{ duration: reduce ? 0 : .35 }}>{children}</motion.div>;
  const selected = selectedId === node.id;
  return (
    <div
      data-eb-id={node.id}
      className={`eb-wrap ${selected ? 'is-selected' : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
    >
      {children}
    </div>
  );
}

export default function PageRenderer({ schema, edit = false, selectedId, onSelect, viewport }) {
  const [width, setWidth] = useState(() => typeof window === 'undefined' ? 1440 : window.innerWidth);
  useEffect(() => {
    const resize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const root = schema?.root;
  if (!root) return null;
  return (
    <div className="pb-page">
      {(root.children || []).map((c) => (
        <NodeView key={c.id} node={c} vw={viewport ?? width} edit={edit} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}
