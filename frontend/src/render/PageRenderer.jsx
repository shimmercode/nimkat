'use client';
/* PageRenderer — renders a page schema (public site + editor canvas) */
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { registry } from '../blocks/registry.js';

const STYLE_KEYS = [
  'background', 'backgroundColor', 'color', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
  'display', 'flexDirection', 'flexWrap', 'alignItems', 'justifyContent', 'gridTemplateColumns', 'width',
  'minHeight', 'height', 'borderWidth', 'borderStyle', 'borderColor', 'overflow', 'columnGap', 'rowGap',
  'marginLeft', 'marginRight', 'marginTop', 'marginBottom', 'borderRadius', 'boxShadow', 'maxWidth',
  'gap', 'opacity', 'fontSize', 'fontWeight', 'lineHeight', 'textAlign',
];

/** Top-level blocks that own full-page or above-the-fold layouts (never scroll-shifted). */
const STATIC_TOP_BLOCKS = new Set([
  'hero',
  'classes-search',
  'teacher-profile',
  'class-detail',
  'club-dashboard',
  'blog-feed',
  'spacer',
  'divider',
]);

function styleFor(node, vw) {
  const s = node.style || {};
  const merged = { ...(s.desktop || {}) };
  if (vw <= 900) Object.assign(merged, s.tablet || {});
  if (vw <= 560) Object.assign(merged, s.mobile || {});
  const out = {};
  for (const k of STYLE_KEYS) {
    if (merged[k] !== undefined && merged[k] !== '') out[k] = merged[k];
  }
  return out;
}

function NodeView({ node, vw, edit, selectedId, onSelect, slots, onPropChange, depth = 0, index = 0 }) {
  const spec = registry[node.type];
  if (!spec) return <div style={{ padding: 12, color: '#B42A48' }}>بلوک ناشناخته: {node.type}</div>;
  const Comp = spec.component;
  const style = edit ? styleFor(node, vw) : undefined;

  if (node.type === 'section') {
    return (
      <EditWrap
        edit={edit}
        node={node}
        depth={depth}
        index={index}
        selectedId={selectedId}
        onSelect={onSelect}
        onPropChange={onPropChange}
      >
        <section
          className={`pb-section ${node.props.className || ''} ${nodeClass(node)}`}
          id={node.props.anchor || undefined}
          style={style}
        >
          <div className="container">
            {(node.children || []).map((c, ci) => (
              <NodeView
                key={c.id}
                node={c}
                vw={vw}
                edit={edit}
                selectedId={selectedId}
                onSelect={onSelect}
                slots={slots}
                onPropChange={onPropChange}
                depth={depth + 1}
                index={ci}
              />
            ))}
          </div>
        </section>
      </EditWrap>
    );
  }

  return (
    <EditWrap
      edit={edit}
      node={node}
      depth={depth}
      index={index}
      selectedId={selectedId}
      onSelect={onSelect}
      onPropChange={onPropChange}
    >
      <div className={nodeClass(node)} style={style}>
        {slots?.[node.type] || (
          <Comp node={node} style={style} editorPreview={edit}>
            {(node.children || []).map((c, ci) => (
              <NodeView
                key={c.id}
                node={c}
                vw={vw}
                edit={edit}
                selectedId={selectedId}
                onSelect={onSelect}
                slots={slots}
                onPropChange={onPropChange}
                depth={depth + 1}
                index={ci}
              />
            ))}
          </Comp>
        )}
      </div>
    </EditWrap>
  );
}

/**
 * Controlled one-time section reveal for below-the-fold top-level builder blocks:
 * - SSR and no-JS stay 100% visible (`initial={false}`).
 * - Nested children (`depth > 0`), first block (`index === 0`), and full-page app widgets
 *   stay completely static to prevent nested animations, hydration jumps, or sticky sidebar issues.
 * - Blocks already in the viewport on mount stay static (`phase = 'visible'`).
 * - Only blocks below the fold on initial mount gently reveal once (`280ms`, `10px`) when scrolled into view.
 */
function PublicRevealWrap({ className, shouldReveal, children }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const [phase, setPhase] = useState('ssr'); // 'ssr' | 'waiting' | 'revealing' | 'done'

  useEffect(() => {
    if (!shouldReveal || reduce) {
      setPhase('done');
      return undefined;
    }
    const el = ref.current;
    if (!el || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setPhase('done');
      return undefined;
    }
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 800;
    // If already visible (or above) in the initial viewport, never snap or re-animate it.
    if (rect.top < vh * 0.94) {
      setPhase('done');
      return undefined;
    }

    setPhase('waiting');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setPhase('revealing');
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -24px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldReveal, reduce]);

  if (!shouldReveal || reduce || phase === 'done' || phase === 'ssr') {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={phase === 'waiting' ? { opacity: 0.01, y: 10 } : { opacity: 1, y: 0 }}
      transition={
        phase === 'waiting'
          ? { duration: 0 }
          : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
      }
      onAnimationComplete={() => {
        if (phase === 'revealing') setPhase('done');
      }}
    >
      {children}
    </motion.div>
  );
}

function EditWrap({ edit, node, depth = 0, index = 0, selectedId, onSelect, children, onPropChange }) {
  const visClass = `pb-visible-${nodeClass(node)}`;
  if (!edit) {
    const shouldReveal = depth === 0 && index > 0 && !STATIC_TOP_BLOCKS.has(node.type);
    return (
      <PublicRevealWrap className={visClass} shouldReveal={shouldReveal}>
        {children}
      </PublicRevealWrap>
    );
  }
  const selected = selectedId === node.id;
  return (
    <div
      data-eb-id={node.id}
      className={`eb-wrap ${visClass} ${selected ? 'is-selected' : ''}`}
      onClickCapture={(e) => {
        if (e.target.isContentEditable) return;
        e.preventDefault();
        e.stopPropagation();
        onSelect(node.id);
      }}
      onDoubleClick={(e) => {
        if (!['heading', 'text'].includes(node.type)) return;
        const target = e.target.closest(node.type === 'heading' ? 'h2' : 'p');
        if (!target || target.isContentEditable) return;
        e.stopPropagation();
        const original = target.innerHTML;
        target.contentEditable = 'true';
        target.focus();
        const paste = (event) => {
          event.preventDefault();
          target.ownerDocument.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
        };
        const key = (event) => {
          if (event.key === 'Escape') {
            target.innerHTML = original;
            target.blur();
          }
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            target.blur();
          }
        };
        target.addEventListener('paste', paste);
        target.addEventListener('keydown', key);
        target.addEventListener(
          'blur',
          () => {
            target.contentEditable = 'false';
            target.removeEventListener('paste', paste);
            target.removeEventListener('keydown', key);
            if (target.innerHTML !== original) {
              onPropChange?.(node.id, node.type === 'heading' ? 'title' : 'text', target.textContent);
            }
          },
          { once: true }
        );
      }}
    >
      {children}
    </div>
  );
}

/** @param {any} props */
export default function PageRenderer({
  schema,
  edit = false,
  selectedId = null,
  onSelect = () => {},
  viewport = undefined,
  slots = undefined,
  onPropChange = undefined,
}) {
  const [width, setWidth] = useState(1440);
  useEffect(() => {
    if (!edit || viewport !== undefined) return undefined;
    const resize = () => setWidth(window.innerWidth);
    resize();
    window.addEventListener('resize', resize, { passive: true });
    return () => window.removeEventListener('resize', resize);
  }, [edit, viewport]);

  const root = schema?.root;
  if (!root) return null;
  return (
    <div className="pb-page">
      <style>{schemaCSS(root, edit)}</style>
      {(root.children || []).map((c, idx) => (
        <NodeView
          key={c.id}
          node={c}
          vw={viewport ?? width}
          edit={edit}
          selectedId={selectedId}
          onSelect={onSelect}
          slots={slots}
          onPropChange={onPropChange}
          depth={0}
          index={idx}
        />
      ))}
    </div>
  );
}

const nodeClass = (n) => 'pb-node-' + Array.from(n.id).map((c) => c.codePointAt(0).toString(16)).join('-');
const unitless = new Set(['opacity', 'fontWeight', 'lineHeight']);
function declarations(styles = {}) {
  return Object.entries(styles)
    .filter(
      ([k, v]) =>
        STYLE_KEYS.includes(k) &&
        v !== '' &&
        v !== null &&
        v !== undefined &&
        !/[{};<>@]|url\s*\(/i.test(String(v))
    )
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}:${typeof v === 'number' && !unitless.has(k) ? v + 'px' : v}`)
    .join(';');
}
function schemaCSS(root, edit) {
  let css = '';
  function rule(selector, body, query) {
    if (body) css += query ? `@media ${query}{${selector}{${body}}}` : `${selector}{${body}}`;
  }
  function visit(n) {
    const name = '.' + nodeClass(n);
    for (const [bp, query] of [
      ['desktop', ''],
      ['tablet', '(max-width:900px)'],
      ['mobile', '(max-width:560px)'],
    ]) {
      rule(name, declarations(n.style?.[bp]), query);
      if (typeof n.visibility?.[bp] === 'boolean') {
        rule(
          '.pb-visible-' + nodeClass(n),
          n.visibility[bp] ? 'display:block!important' : edit ? 'opacity:.35' : 'display:none!important',
          query
        );
      }
    }
    for (const c of n.children || []) visit(c);
  }
  if (root) visit(root);
  return css;
}
