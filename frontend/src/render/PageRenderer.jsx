'use client';
/* PageRenderer — renders a page schema (public site + editor canvas) */
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { registry, getIn } from '../blocks/registry.js';

const STYLE_KEYS = ['background', 'backgroundColor', 'color', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
  'display','flexDirection','flexWrap','alignItems','justifyContent','gridTemplateColumns','width','minHeight','height','borderWidth','borderStyle','borderColor','overflow','columnGap','rowGap','marginLeft','marginRight','marginTop', 'marginBottom', 'borderRadius', 'boxShadow', 'maxWidth', 'gap', 'opacity', 'fontSize', 'fontWeight', 'lineHeight', 'textAlign'];

function styleFor(node, vw) {
  const s = node.style || {};
  const merged = { ...(s.desktop || {}) };
  if (vw <= 900) Object.assign(merged, s.tablet || {});
  if (vw <= 560) Object.assign(merged, s.mobile || {});
  const out = {};
  for (const k of STYLE_KEYS) if (merged[k] !== undefined && merged[k] !== '') out[k] = merged[k];
  return out;
}

function NodeView({ node, vw, edit, selectedId, onSelect, slots, onPropChange }) {
  const spec = registry[node.type];
  if (!spec) return <div style={{ padding: 12, color: '#B42A48' }}>بلوک ناشناخته: {node.type}</div>;
  const Comp = spec.component;
  const style = styleFor(node, vw);

  if (node.type === 'section') {
    return (
      <EditWrap edit={edit} node={node} selectedId={selectedId} onSelect={onSelect} onPropChange={onPropChange}>
        <section className={`pb-section ${node.props.className || ''} ${nodeClass(node)}`} id={node.props.anchor || undefined} style={edit?style:undefined}>
          <div className="container">
            {(node.children || []).map((c) => (
              <NodeView key={c.id} node={c} vw={vw} edit={edit} selectedId={selectedId} onSelect={onSelect} slots={slots} onPropChange={onPropChange} />
            ))}
          </div>
        </section>
      </EditWrap>
    );
  }

  return (
    <EditWrap edit={edit} node={node} selectedId={selectedId} onSelect={onSelect} onPropChange={onPropChange}>
      <div className={nodeClass(node)} style={edit?style:undefined}>
        {slots?.[node.type]||<Comp node={node} style={edit?style:undefined} editorPreview={edit}>
          {(node.children || []).map((c) => (
            <NodeView key={c.id} node={c} vw={vw} edit={edit} selectedId={selectedId} onSelect={onSelect} slots={slots} onPropChange={onPropChange} />
          ))}
        </Comp>}
      </div>
    </EditWrap>
  );
}

function EditWrap({ edit, node, selectedId, onSelect, children,onPropChange }) {
  const reduce = useReducedMotion();
  if (!edit) return <motion.div className={'pb-visible-'+nodeClass(node)} initial={false} whileInView={reduce ? { opacity: 1, y: 0 } : { opacity: [.85, 1], y: [12, 0] }} viewport={{ once: true, amount: 0.05 }} transition={{ duration: reduce ? 0 : .35 }}>{children}</motion.div>;
  const selected = selectedId === node.id;
  return (
    <div
      data-eb-id={node.id}
      className={`eb-wrap pb-visible-${nodeClass(node)} ${selected ? 'is-selected' : ''}`}
      onClickCapture={(e) => { if(e.target.isContentEditable)return;e.preventDefault();e.stopPropagation(); onSelect(node.id); }}
      onDoubleClick={e=>{if(!['heading','text'].includes(node.type))return;const target=e.target.closest(node.type==='heading'?'h2':'p');if(!target||target.isContentEditable)return;e.stopPropagation();const original=target.innerHTML;target.contentEditable='true';target.focus();const paste=event=>{event.preventDefault();target.ownerDocument.execCommand('insertText',false,event.clipboardData.getData('text/plain'));};const key=event=>{if(event.key==='Escape'){target.innerHTML=original;target.blur();}if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();target.blur();}};target.addEventListener('paste',paste);target.addEventListener('keydown',key);target.addEventListener('blur',()=>{target.contentEditable='false';target.removeEventListener('paste',paste);target.removeEventListener('keydown',key);if(target.innerHTML!==original)onPropChange?.(node.id,node.type==='heading'?'title':'text',target.textContent);},{once:true});}}
    >
      {children}
    </div>
  );
}

/** @param {any} props */
export default function PageRenderer({ schema, edit = false, selectedId = null, onSelect = () => {}, viewport = undefined, slots = undefined,onPropChange=undefined }) {
  const [width, setWidth] = useState(1440);
  useEffect(() => {
    const resize = () => setWidth(window.innerWidth);
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const root = schema?.root;
  if (!root) return null;
  return (
    <div className="pb-page">
      <style>{schemaCSS(root,edit)}</style>
      {(root.children || []).map((c) => (
        <NodeView key={c.id} node={c} vw={viewport ?? width} edit={edit} selectedId={selectedId} onSelect={onSelect} slots={slots} onPropChange={onPropChange} />
      ))}
    </div>
  );
}

const nodeClass=n=>'pb-node-'+Array.from(n.id).map(c=>c.codePointAt(0).toString(16)).join('-');
const unitless=new Set(['opacity','fontWeight','lineHeight']);
function declarations(styles={}){return Object.entries(styles).filter(([k,v])=>STYLE_KEYS.includes(k)&&v!==''&&v!==null&&v!==undefined&&!/[{};<>@]|url\s*\(/i.test(String(v))).map(([k,v])=>`${k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}:${typeof v==='number'&&!unitless.has(k)?v+'px':v}`).join(';');}
function schemaCSS(root,edit){let css='';function rule(selector,body,query){if(body)css+=query?`@media ${query}{${selector}{${body}}}`:`${selector}{${body}}`;}function visit(n){const name='.'+nodeClass(n);for(const [bp,query] of [['desktop',''],['tablet','(max-width:900px)'],['mobile','(max-width:560px)']]){rule(name,declarations(n.style?.[bp]),query);if(typeof n.visibility?.[bp]==='boolean')rule('.pb-visible-'+nodeClass(n),n.visibility[bp]?'display:block!important':edit?'opacity:.35':'display:none!important',query);}for(const c of n.children||[])visit(c);}if(root)visit(root);return css;}
