/* Editor shell — topbar, layers (drag&drop), block library, canvas, versions & templates modals */
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { registry, categories, findNode, clone } from '../blocks/registry.js';
import { defaultHomeSchema } from '../blocks/homeSchema.js';
import { useEditorStore } from './store.js';
import Inspector from './Inspector.jsx';
import PageRenderer from '../render/PageRenderer.jsx';
import { api, getToken } from '../api.js';
import { toast } from '../utils/toast.js';
import './editor.css';

const slugDefaults = {
  home: () => defaultHomeSchema(),
};

function Layers({ store }) {
  const { schema, selectedId, setSelectedId, dropNode, moveNode, removeNode, duplicateNode } = store;
  const [dragId, setDragId] = useState(null);
  const [dropOn, setDropOn] = useState(null);

  const rows = [];
  const build = (node, depth) => {
    const spec = registry[node.type];
    rows.push({ node, depth, label: spec?.label || node.type });
    (node.children || []).forEach((c) => build(c, depth + 1));
  };
  (schema.root.children || []).forEach((c) => build(c, 0));

  return (
    <div className="layers">
      <div className="panel-title">لایه‌ها</div>
      {rows.map(({ node, depth, label }) => (
        <div
          key={node.id}
          className={`layer-row ${selectedId === node.id ? 'is-on' : ''} ${dropOn === node.id ? 'drop-on' : ''}`}
          style={{ paddingRight: 10 + depth * 14 }}
          draggable
          onDragStart={(e) => { setDragId(node.id); e.dataTransfer.effectAllowed = 'move'; }}
          onDragOver={(e) => { e.preventDefault(); setDropOn(node.id); }}
          onDragLeave={() => setDropOn((d) => (d === node.id ? null : d))}
          onDrop={(e) => {
            e.preventDefault();
            if (dragId && dragId !== node.id) dropNode(dragId, node.id, 'after');
            setDragId(null); setDropOn(null);
          }}
          onClick={() => setSelectedId(node.id)}
        >
          <span className="layer-label">{label}</span>
          <span className="layer-actions">
            <button type="button" title="بالا" onClick={(e) => { e.stopPropagation(); moveNode(node.id, -1); }}>↑</button>
            <button type="button" title="پایین" onClick={(e) => { e.stopPropagation(); moveNode(node.id, 1); }}>↓</button>
            <button type="button" title="کپی" onClick={(e) => { e.stopPropagation(); duplicateNode(node.id); }}>⧉</button>
            <button type="button" title="حذف" className="danger" onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}>✕</button>
          </span>
        </div>
      ))}
    </div>
  );
}

function BlockLibrary({ store }) {
  const { addBlock, selectedId } = store;
  const [openCat, setOpenCat] = useState('ویژه');
  const items = Object.entries(registry).filter(([, s]) => s.category === openCat);
  return (
    <div className="lib">
      <div className="panel-title">افزودن بلوک</div>
      <div className="lib-cats">
        {categories.map((c) => (
          <button key={c} type="button" className={openCat === c ? 'is-on' : ''} onClick={() => setOpenCat(c)}>{c}</button>
        ))}
      </div>
      <div className="lib-items">
        {items.map(([type, s]) => (
          <button
            key={type}
            type="button"
            className="lib-item"
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/new-block', type); }}
            onClick={() => { addBlock(type, selectedId); toast(`بلوک «${s.label}» اضافه شد`); }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><b>{title}</b><button type="button" onClick={onClose}>✕</button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function Editor() {
  const { slug = 'home' } = useParams();
  const navigate = useNavigate();
  const store = useEditorStore(slugDefaults[slug] ? slugDefaults[slug]() : { root: { id: 'root', type: 'page', props: {}, style: {}, children: [] } });
  const { schema, loadSchema, undo, redo, canUndo, canRedo, dirty, setDirty, selectedId, setSelectedId, addBlock } = store;
  const [breakpoint, setBreakpoint] = useState('desktop');
  const [status, setStatus] = useState('draft');
  const [modal, setModal] = useState(null); // 'versions' | 'templates' | 'saveTemplate'
  const [versions, setVersions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [tplName, setTplName] = useState('');
  const canvasRef = useRef(null);

  const vpWidth = breakpoint === 'desktop' ? '100%' : breakpoint === 'tablet' ? 768 : 375;

  useEffect(() => {
    if (!getToken()) {
      toast('برای ویرایش اول وارد شوید (شماره‌ی مدیر)', 'err');
      navigate('/login');
      return;
    }
    api(`/pages/${slug}?preview=1`).then((d) => {
      if (d.page) { loadSchema(d.page.schema); setStatus(d.page.status); }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  const save = async () => {
    try {
      await api(`/pages/${slug}`, { method: 'PUT', body: { schema, title: schema.root?.props?.title || slug } });
      setDirty(false);
      toast('پیش‌نویس ذخیره شد ✓');
    } catch (e) { toast(e.message || 'خطا در ذخیره', 'err'); }
  };

  const publish = async () => {
    try {
      await api(`/pages/${slug}`, { method: 'PUT', body: { schema, title: schema.root?.props?.title || slug } });
      await api(`/pages/${slug}/publish`, { method: 'POST', body: {} });
      setStatus('published');
      setDirty(false);
      toast('صفحه منتشر شد ✓');
    } catch (e) { toast(e.message || 'خطا در انتشار', 'err'); }
  };

  const openVersions = async () => {
    try {
      const d = await api(`/pages/${slug}/versions`);
      setVersions(d.versions || []);
      setModal('versions');
    } catch (e) { toast(e.message, 'err'); }
  };

  const restoreVersion = async (vid) => {
    try {
      const d = await api(`/pages/${slug}/versions/${vid}/restore`, { method: 'POST', body: {} });
      if (d.schema) loadSchema(d.schema);
      toast('نسخه بازگردانی شد ✓');
      setModal(null);
    } catch (e) { toast(e.message, 'err'); }
  };

  const openTemplates = async () => {
    try {
      const d = await api('/templates');
      setTemplates(d.templates || []);
      setModal('templates');
    } catch (e) { toast(e.message, 'err'); }
  };

  const applyTemplate = (t) => {
    loadSchema(t.schema);
    setModal(null);
    toast(`قالب «${t.name}» اعمال شد`);
  };

  const saveAsTemplate = async () => {
    if (!tplName.trim()) { toast('نام قالب را بنویسید', 'err'); return; }
    try {
      await api('/templates', { method: 'POST', body: { name: tplName.trim(), category: 'عمومی', schema } });
      toast('قالب ذخیره شد ✓');
      setModal(null);
      setTplName('');
    } catch (e) { toast(e.message, 'err'); }
  };

  return (
    <div className="editor">
      <div className="ed-topbar">
        <div className="ed-top-right">
          <Link to="/" className="ed-logo">نیمکت <span>· ویرایشگر</span></Link>
          <span className="ed-slug">/{slug}</span>
          <span className={`ed-status ${status}`}>{status === 'published' ? 'منتشرشده' : 'پیش‌نویس'}{dirty ? ' •' : ''}</span>
        </div>
        <div className="ed-devices">
          {[['desktop', '🖥'], ['tablet', '📱'], ['mobile', '📲']].map(([k, ic]) => (
            <button key={k} type="button" className={breakpoint === k ? 'is-on' : ''} onClick={() => setBreakpoint(k)} title={k}>{ic}</button>
          ))}
        </div>
        <div className="ed-top-left">
          <button type="button" onClick={undo} disabled={!canUndo()} title="بازگردانی (Ctrl+Z)">↶</button>
          <button type="button" onClick={redo} disabled={!canRedo()} title="دوباره (Ctrl+Shift+Z)">↷</button>
          <button type="button" className="ed-btn" onClick={openVersions}>نسخه‌ها</button>
          <button type="button" className="ed-btn" onClick={openTemplates}>قالب‌ها</button>
          <button type="button" className="ed-btn" onClick={() => setModal('saveTemplate')}>ذخیره به‌عنوان قالب</button>
          <button type="button" className="ed-btn ghost" onClick={save}>ذخیره</button>
          <button type="button" className="ed-btn primary" onClick={publish}>انتشار</button>
        </div>
      </div>

      <div className="ed-main">
        <div className="ed-side right">
          <BlockLibrary store={store} />
          <Layers store={store} />
        </div>

        <div className="ed-canvas-wrap" onClick={() => setSelectedId(null)}>
          <div className="ed-canvas" ref={canvasRef} style={{ width: vpWidth }}>
            <div
              className="ed-canvas-inner"
              onDragOver={(e) => { if (e.dataTransfer.types.includes('text/new-block')) e.preventDefault(); }}
              onDrop={(e) => {
                const t = e.dataTransfer.getData('text/new-block');
                if (t) { addBlock(t, selectedId); toast(`بلوک اضافه شد`); }
              }}
            >
              <PageRenderer schema={schema} edit selectedId={selectedId} onSelect={setSelectedId} viewport={breakpoint === 'desktop' ? 1440 : breakpoint === 'tablet' ? 768 : 375} />
            </div>
          </div>
        </div>

        <div className="ed-side left">
          <Inspector store={store} breakpoint={breakpoint} setBreakpoint={setBreakpoint} />
        </div>
      </div>

      {modal === 'versions' && (
        <Modal title="تاریخچه‌ی نسخه‌ها" onClose={() => setModal(null)}>
          {versions.length === 0 && <p className="t-small t-muted">هنوز نسخه‌ای ذخیره نشده است.</p>}
          {versions.map((v) => (
            <div className="ver-row" key={v.id}>
              <div>
                <b>{v.label || `نسخه ${v.id}`}</b>
                <div className="t-caption t-muted">{v.created_at}</div>
              </div>
              <button type="button" className="ed-btn" onClick={() => restoreVersion(v.id)}>بازگردانی</button>
            </div>
          ))}
        </Modal>
      )}

      {modal === 'templates' && (
        <Modal title="کتابخانه‌ی قالب‌ها" onClose={() => setModal(null)}>
          {templates.length === 0 && <p className="t-small t-muted">قالبی ثبت نشده است.</p>}
          {templates.map((t) => (
            <div className="ver-row" key={t.id}>
              <div>
                <b>{t.name}</b>
                <div className="t-caption t-muted">{t.category}</div>
              </div>
              <button type="button" className="ed-btn primary" onClick={() => applyTemplate(t)}>اعمال</button>
            </div>
          ))}
        </Modal>
      )}

      {modal === 'saveTemplate' && (
        <Modal title="ذخیره به‌عنوان قالب" onClose={() => setModal(null)}>
          <label className="insp-col">
            <span>نام قالب</span>
            <input className="insp-input" value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="مثلاً لندینگ کمپین پاییز" />
          </label>
          <button type="button" className="ed-btn primary" style={{ marginTop: 12 }} onClick={saveAsTemplate}>ذخیره‌ی قالب</button>
        </Modal>
      )}
    </div>
  );
}
