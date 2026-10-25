/* Editor store — schema mutations with undo/redo history */
import { useCallback, useRef, useState } from 'react';
import { findNode, clone, setIn, createNode, uid, registry } from '../blocks/registry.js';

const LIMIT = 60;

export function useEditorStore(initialSchema) {
  const [schema, setSchema] = useState(initialSchema);
  const [selectedId, setSelectedId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const past = useRef([]);
  const future = useRef([]);
  const [, bump] = useState(0);
  const force = () => bump((x) => x + 1);

  const schemaRef = useRef(initialSchema);

  const apply = useCallback((fn, { history = true } = {}) => {
    const next = clone(schemaRef.current);
    fn(next);
    if(JSON.stringify(next)===JSON.stringify(schemaRef.current))return;
    if (history) {
      past.current.push(clone(schemaRef.current));
      if (past.current.length > LIMIT) past.current.shift();
      future.current = [];
    }
    schemaRef.current = next;
    setSchema(next);
    setDirty(true);
    force();
  }, []);

  const undo = useCallback(() => {
    if (!past.current.length) return;
    future.current.push(clone(schemaRef.current));
    const prev = past.current.pop();
    schemaRef.current = prev;
    setSchema(prev);
    setDirty(true);
    force();
  }, []);

  const redo = useCallback(() => {
    if (!future.current.length) return;
    past.current.push(clone(schemaRef.current));
    const nxt = future.current.pop();
    schemaRef.current = nxt;
    setSchema(nxt);
    setDirty(true);
    force();
  }, []);

  const setProp = useCallback((id, dottedKey, value) => {
    apply((s) => {
      const f = findNode(s.root, id);
      if (f) setIn(f.node.props, dottedKey, value);
    });
  }, [apply]);

  const setStyle = useCallback((id, breakpoint, key, value) => {
    apply((s) => {
      const f = findNode(s.root, id);
      if (f) {
        f.node.style = f.node.style || { desktop: {}, tablet: {}, mobile: {} };
        f.node.style[breakpoint] = f.node.style[breakpoint] || {};
        f.node.style[breakpoint][key] = value;
      }
    });
  }, [apply]);

  const addBlock = useCallback((type, afterId = null, parentId = null) => {
    let newId = null;
    apply((s) => {
      const node = createNode(type);
      newId = node.id;
      let container = s.root;
      if (parentId) {
        const f = findNode(s.root, parentId);
        if (f && registry[f.node.type]?.container) container = f.node;
        else return;
      } else if (afterId) {
        const f = findNode(s.root, afterId);
        if (f && f.parent) container = f.parent;
      }
      const kids = container.children || (container.children = []);
      const idx = afterId ? kids.findIndex((k) => k.id === afterId) : -1;
      if (idx >= 0) kids.splice(idx + 1, 0, node);
      else kids.push(node);
    });
    if (newId) setSelectedId(newId);
    return newId;
  }, [apply]);

  const removeNode = useCallback((id) => {
    apply((s) => {
      const f = findNode(s.root, id);
      if (f && f.parent) {
        f.parent.children = f.parent.children.filter((c) => c.id !== id);
      }
    });
    setSelectedId((cur) => (cur === id ? null : cur));
  }, [apply]);

  const duplicateNode = useCallback((id) => {
    apply((s) => {
      const f = findNode(s.root, id);
      if (f && f.parent) {
        const copy = clone(f.node);
        walkRegen(copy);
        const idx = f.parent.children.findIndex((c) => c.id === id);
        f.parent.children.splice(idx + 1, 0, copy);
      }
    });
  }, [apply]);

  const moveNode = useCallback((id, dir) => {
    apply((s) => {
      const f = findNode(s.root, id);
      if (!f || !f.parent) return;
      const kids = f.parent.children;
      const i = kids.findIndex((c) => c.id === id);
      const j = i + dir;
      if (j < 0 || j >= kids.length) return;
      [kids[i], kids[j]] = [kids[j], kids[i]];
    });
  }, [apply]);

  /* drag & drop: move srcId to be a sibling before/after targetId (or inside containerId at end) */
  const dropNode = useCallback((srcId, targetId, mode = 'after') => {
    if (srcId === targetId) return;
    apply((s) => {
      const src = findNode(s.root, srcId);
      const tgt = findNode(s.root, targetId);
      if (!src || !tgt || !src.parent || (mode==='inside'&&!registry[tgt.node.type]?.container) || (mode!=='inside'&&!tgt.parent)) return;
      // prevent dropping into own descendant
      let isDesc = false;
      const scan = (n) => { if (n.id === targetId) isDesc = true; (n.children || []).forEach(scan); };
      scan(src.node);
      if (isDesc) return;
      src.parent.children = src.parent.children.filter((c) => c.id !== srcId);
      if (mode === 'inside') {
        tgt.node.children = tgt.node.children || [];
        tgt.node.children.push(src.node);
      } else {
        const kids = tgt.parent ? tgt.parent.children : s.root.children;
        const idx = kids.findIndex((c) => c.id === targetId);
        kids.splice(mode === 'before' ? idx : idx + 1, 0, src.node);
      }
    });
  }, [apply]);

  const loadSchema = useCallback((s, { clean = true } = {}) => {
    if(!clean){past.current.push(clone(schemaRef.current));if(past.current.length>LIMIT)past.current.shift();future.current=[];}
    schemaRef.current = clone(s);
    setSchema(schemaRef.current);
    if(!clean)setDirty(true);
    if (clean) { past.current = []; future.current = []; setDirty(false); }
    force();
  }, []);

  return {
    schema, selectedId, setSelectedId, dirty, setDirty,
    apply, undo, redo, canUndo: () => past.current.length > 0, canRedo: () => future.current.length > 0,
    resetStyle:(id,bp)=>apply(s=>{const f=findNode(s.root,id);if(f?.node.style)f.node.style[bp]={};}),
    setProp, setStyle, addBlock, removeNode, duplicateNode, moveNode, dropNode, loadSchema,
  };
}

function walkRegen(node) {
  node.id = uid();
  (node.children || []).forEach(walkRegen);
}
