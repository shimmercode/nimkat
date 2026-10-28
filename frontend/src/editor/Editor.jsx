'use client';
/* Editor shell — topbar, layers (drag&drop), block library, canvas, versions & templates modals */
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from '../routing/navigation';
import { registry, categories, findNode, clone } from '../blocks/registry.js';
import { defaultHomeSchema } from '../blocks/homeSchema.js';
import { editablePages, defaultApplicationSchema } from '../blocks/pageSchemas.js';
import { useAuth } from '../auth.jsx';
import { useEditorStore } from './store.js';
import CanvasFrame from './CanvasFrame.jsx';
import Inspector from './Inspector.jsx';
import PageRenderer from '../render/PageRenderer.jsx';
import { api } from '../api.js';
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
    rows.push({ node, depth, label: node.props.label || spec?.label || node.type });
    (node.children || []).forEach((c) => build(c, depth + 1));
  };
  (schema.root.children || []).forEach((c) => build(c, 0));

  return (
    <div className="layers">
      <div className="panel-title">لایه‌ها</div><p className="ed-hint">کشیدن: بعد از مقصد · Shift: قبل · Alt: داخل کانتینر</p>
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
            if (dragId && dragId !== node.id) dropNode(dragId, node.id, e.altKey?'inside':e.shiftKey?'before':'after');
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
            onClick={() => { const f=selectedId&&findNode(store.schema.root,selectedId);addBlock(type,f&&registry[f.node.type]?.container?null:selectedId,f&&registry[f.node.type]?.container?selectedId:null); toast(`بلوک «${s.label}» اضافه شد`); }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  const ref=useRef(null);useEffect(()=>{const previous=document.activeElement;ref.current?.querySelector('button,input,select')?.focus();return()=>previous?.focus?.();},[]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" ref={ref} role="dialog" aria-modal="true" aria-label={title} onKeyDown={e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const items=[...ref.current.querySelectorAll('button:not(:disabled),input,select,textarea,a[href]')];const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><b>{title}</b><button type="button" onClick={onClose}>✕</button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function Editor() {
  const { slug = 'home' } = useParams();
  const navigate = useNavigate();
  const { user, loading, requestOtp, verifyOtp, logout } = useAuth();
  const [loadError, setLoadError] = useState('');
  const [adminSwitching, setAdminSwitching] = useState(false);
  const [pageReady,setPageReady]=useState(false);
  const store = useEditorStore(slugDefaults[slug] ? slugDefaults[slug]() : defaultApplicationSchema(slug));
  const { schema, loadSchema, undo, redo, canUndo, canRedo, dirty, setDirty, selectedId, setSelectedId, addBlock } = store;
  const [breakpoint, setBreakpoint] = useState('desktop');
  const [status, setStatus] = useState('draft');
  const [modal, setModal] = useState(null); // 'versions' | 'templates' | 'saveTemplate'
  const [versions, setVersions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [tplName, setTplName] = useState('');
  const [customPages,setCustomPages]=useState([]),[newSlug,setNewSlug]=useState(''),[newTitle,setNewTitle]=useState('');
  const pages=[...editablePages,...customPages.filter(p=>!editablePages.some(x=>x.slug===p.slug)).map(p=>({...p,href:/^teacher-\d+$/.test(p.slug)?`/teachers/${p.slug.slice(8)}`:/^class-\d+$/.test(p.slug)?`/classes/${p.slug.slice(6)}`:`/p/${p.slug}`}))];
  const canvasRef = useRef(null);
  const revisionRef=useRef(0),schemaRef=useRef(schema),busyRef=useRef(false);schemaRef.current=schema;
  const [busy,setBusy]=useState(false),[recovery,setRecovery]=useState(null),[panel,setPanel]=useState('canvas');
  const recoveryKey=`nimkat-editor:${user?.id}:${slug}`;

  const vpWidth = breakpoint === 'desktop' ? 1280 : breakpoint === 'tablet' ? 768 : 375;

  const handleQuickAdminLogin = async () => {
    setAdminSwitching(true);
    try {
      const otp = await requestOtp('09120000000');
      if (otp?.devCode) {
        await verifyOtp('09120000000', otp.devCode, 'admin');
        setLoadError('');
        toast('با حساب مدیر وارد شدید ✓');
        return;
      }
      await logout?.();
      navigate(`/login?next=${encodeURIComponent(`/editor/${slug}`)}&admin=1`);
    } catch (e) {
      toast(e.message || 'خطا در ورود به حساب مدیر', 'err');
      navigate(`/login?next=${encodeURIComponent(`/editor/${slug}`)}&admin=1`);
    } finally {
      setAdminSwitching(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'admin') {
      setLoadError('دسترسی به ویرایشگر فقط برای مدیر سایت است.');
      return;
    }
    let active = true;
    setLoadError('');setPageReady(false);
    setSelectedId(null);
    loadSchema(slug === 'home' ? defaultHomeSchema() : defaultApplicationSchema(slug));
    setStatus('draft');revisionRef.current=0;setRecovery(null);
    api('/pages').then(d=>{if(active)setCustomPages(d.pages||[]);}).catch(()=>{});
    api(`/pages/${slug}?preview=1`).then((d) => {
      if(active){revisionRef.current=d.page?.revision||0;if(d.page){loadSchema(d.page.schema);setStatus(d.page.status);}try{const saved=JSON.parse(localStorage.getItem(recoveryKey)||'null');setRecovery(saved?.schema?saved:null);}catch{setRecovery(null);}setPageReady(true);}
    }).catch((e) => { if (active) setLoadError(e.message || 'خطا در بارگذاری صفحه'); });
    return () => { active = false; };
  }, [slug, loading, user, navigate, loadSchema, setSelectedId]);

  useEffect(()=>{const leave=e=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',leave);return()=>window.removeEventListener('beforeunload',leave);},[dirty]);
  useEffect(()=>{if(!dirty||!user)return;const timer=setTimeout(()=>{try{localStorage.setItem(recoveryKey,JSON.stringify({schema,revision:revisionRef.current,time:Date.now()}));}catch{/* Storage may be unavailable; manual save remains available. */}},500);return()=>clearTimeout(timer);},[schema,dirty,recoveryKey,user]);
  const onKey=e=>{const typing=e.target?.matches?.('input,textarea,select,[contenteditable="true"]');if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();}else if(!typing&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}else if(!typing&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}};
  useEffect(()=>{window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);});
  async function persist(publishing=false){if(busyRef.current)return;busyRef.current=true;setBusy(true);const current=schemaRef.current;try{const saved=await api(`/pages/${slug}`,{method:'PUT',body:{schema:current,title:current.root?.props?.title||slug,revision:revisionRef.current}});revisionRef.current=saved.page.revision;if(publishing){const result=await api(`/pages/${slug}/publish`,{method:'POST',body:{revision:revisionRef.current}});revisionRef.current=result.revision;setStatus('published');}if(JSON.stringify(current)===JSON.stringify(schemaRef.current)){setDirty(false);try{localStorage.removeItem(recoveryKey);}catch{}}toast(publishing?'صفحه منتشر شد ✓':'پیش‌نویس ذخیره شد ✓');}catch(e){toast(e.message||'ذخیره انجام نشد','err');}finally{busyRef.current=false;setBusy(false);}}
  const save=()=>persist(false),publish=()=>persist(true);

  const openVersions = async () => {
    try {
      const d = await api(`/pages/${slug}/versions`);
      setVersions(d.versions || []);
      setModal('versions');
    } catch (e) { toast(e.message, 'err'); }
  };

  const restoreVersion = async (vid) => {
    if(dirty&&!window.confirm('تغییرات ذخیره‌نشده کنار گذاشته و نسخهٔ انتخابی به پیش‌نویس برگردد؟'))return;
    try {
      const d = await api(`/pages/${slug}/versions/${vid}/restore`, { method: 'POST', body: {revision:revisionRef.current} });
      if (d.schema) {loadSchema(d.schema);revisionRef.current=d.revision;}
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
    loadSchema(t.schema,{clean:false});
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

  if (loading) return <div className="container section">در حال بررسی دسترسی…</div>;
  if (loadError) {
    return (
      <div className="container section" role="alert" style={{ maxWidth: 640, margin: '48px auto', background: '#fff', border: '1px solid var(--n-200)', borderRadius: 20, padding: '28px 32px', boxShadow: '0 10px 30px rgba(23,33,30,0.06)' }}>
        <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--n-900)', marginBottom: 8 }}>{loadError}</div>
        <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--n-700)', lineHeight: 1.8 }}>
          برای باز شدن ویرایشگر صفحات، باید با شماره موبایل مدیر سایت (<b>۰۹۱۲۰۰۰۰۰۰۰</b>) وارد شوید. با کلیک روی دکمهٔ زیر، در محیط توسعه به‌صورت خودکار وارد حساب مدیر می‌شوید و ویرایشگر باز می‌شود:
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={adminSwitching}
            onClick={handleQuickAdminLogin}
          >
            {adminSwitching ? 'در حال ورود به حساب مدیر…' : 'ورود فوری با حساب مدیر (۰۹۱۲۰۰۰۰۰۰۰) و باز کردن ویرایشگر'}
          </button>
          <Link to={`/login?next=${encodeURIComponent(`/editor/${slug}`)}&admin=1`} className="btn btn-outline">
            صفحهٔ ورود مدیر
          </Link>
          <Link to="/" className="btn btn-ghost">بازگشت به سایت</Link>
        </div>
      </div>
    );
  }
  if (!user || user.role !== 'admin') return null;
  if(!pageReady)return <div className="container section" role="status">دریافت نسخهٔ معتبر صفحه…</div>;

  return (
    <div className="editor">
      <div className="ed-topbar">
        <div className="ed-top-right">
          <Link to="/" className="ed-logo">نیمکت <span>· ویرایشگر</span></Link>
          <select aria-label="انتخاب صفحه برای ویرایش" className="ed-page-select" value={slug} onChange={(e) => {
            if (dirty && !window.confirm('تغییرات ذخیره نشده‌اند. از این صفحه خارج می‌شوید؟')) return;
            navigate(`/editor/${e.target.value}`);
          }}>
            {!pages.some((p) => p.slug === slug) && <option value={slug}>{slug}</option>}
            {pages.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
          </select>
          <Link className="ed-live-link" to={editablePages.find((p) => p.slug === slug)?.href || (slug.match(/^teacher-(\d+)$/) ? `/teachers/${slug.slice(8)}` : slug.match(/^class-(\d+)$/) ? `/classes/${slug.slice(6)}` : `/p/${slug}`)} target="_blank" rel="noopener noreferrer">نمایش صفحه ↗</Link>
          <span className={`ed-status ${status}`}>{status === 'published' ? 'منتشرشده' : 'پیش‌نویس'}{dirty ? ' •' : ''}</span>
        </div>
        <div className="ed-devices">
          {[['desktop', 'دسکتاپ'], ['tablet', 'تبلت'], ['mobile', 'موبایل']].map(([k, ic]) => (
            <button key={k} type="button" className={breakpoint === k ? 'is-on' : ''} onClick={() => setBreakpoint(k)} title={k}>{ic}</button>
          ))}
        </div>
        <div className="ed-top-left">
          <button type="button" onClick={undo} disabled={!canUndo()} title="بازگردانی (Ctrl+Z)">↶</button>
          <button type="button" onClick={redo} disabled={!canRedo()} title="دوباره (Ctrl+Shift+Z)">↷</button>
          <button type="button" className="ed-btn" onClick={()=>setModal('newPage')}>صفحهٔ جدید</button>
          <button type="button" className="ed-btn" onClick={openVersions}>نسخه‌ها</button>
          <button type="button" className="ed-btn" onClick={openTemplates}>قالب‌ها</button>
          <button type="button" className="ed-btn" onClick={() => setModal('saveTemplate')}>ذخیره به‌عنوان قالب</button>
          <button type="button" className="ed-btn ghost" disabled={busy} onClick={save}>ذخیره</button>
          <button type="button" className="ed-btn primary" disabled={busy} onClick={publish}>انتشار</button>
          {status==='published'&&<button type="button" className="ed-btn" disabled={busy} onClick={async()=>{if(!window.confirm('صفحه از انتشار خارج شود؟ نسخهٔ ذخیره‌شده حذف نمی‌شود.'))return;try{const r=await api(`/pages/${slug}/unpublish`,{method:'POST',body:{revision:revisionRef.current}});revisionRef.current=r.revision;setStatus('draft');toast('صفحه از انتشار خارج شد.');}catch(e){toast(e.message,'err');}}}>خروج از انتشار</button>}
        </div>
      </div>

      {recovery&&<div className="ed-recovery" role="status">تغییرات محلی ذخیره‌نشده پیدا شد؛ هنوز منتشر نشده‌اند. <button className="ed-btn" onClick={()=>{loadSchema(recovery.schema,{clean:false});setRecovery(null);}}>بازیابی تغییرات محلی</button><button className="ed-btn" onClick={()=>{localStorage.removeItem(recoveryKey);setRecovery(null);}}>کنارگذاشتن بازیابی</button></div>}
      <nav className="ed-mobile-nav" aria-label="بخش‌های ویرایشگر">{[['layers','بلوک‌ها و لایه‌ها'],['canvas','بوم'],['inspector','تنظیمات']].map(([id,label])=><button key={id} className="ed-btn" aria-pressed={panel===id} onClick={()=>setPanel(id)}>{label}</button>)}</nav>
      <div className={`ed-main ed-panel-${panel}`}>
        <div className="ed-side right">
          <BlockLibrary store={store} />
          <Layers store={store} />
        </div>

        <div className="ed-canvas-wrap" onClick={() => setSelectedId(null)}>
          <div className="ed-canvas" ref={canvasRef} style={{ width: vpWidth,flexShrink:0,height:'100%',minHeight:600 }}>
            <CanvasFrame width={vpWidth} onKeyDown={onKey} onDrop={e=>{const type=e.dataTransfer.getData('text/new-block');if(type&&registry[type])addBlock(type,selectedId);}}>
              <PageRenderer schema={schema} edit selectedId={selectedId} onSelect={setSelectedId} viewport={vpWidth} onPropChange={store.setProp}/>
            </CanvasFrame>
          </div>
        </div>

        <div className="ed-side left">
          <Inspector store={store} breakpoint={breakpoint} setBreakpoint={setBreakpoint} />
        </div>
      </div>

      {modal==='newPage'&&<Modal title="ساخت صفحهٔ عمومی جدید" onClose={()=>setModal(null)}><form onSubmit={async e=>{e.preventDefault();if(dirty&&!window.confirm('تغییرات فعلی ذخیره نشده‌اند. ادامه می‌دهید؟'))return;try{const next=defaultApplicationSchema(newSlug);next.root.props.title=newTitle;await api(`/pages/${newSlug}`,{method:'PUT',body:{schema:next,title:newTitle,revision:0}});setModal(null);navigate(`/editor/${newSlug}`);}catch(err){toast(err.message,'err');}}}><label className="insp-col">نشانی انگلیسی صفحه<input className="insp-input" value={newSlug} pattern="[a-z0-9][a-z0-9-]{1,63}" required onChange={e=>setNewSlug(e.target.value)}/></label><label className="insp-col">عنوان صفحه<input className="insp-input" value={newTitle} minLength={2} maxLength={150} required onChange={e=>setNewTitle(e.target.value)}/></label><button className="ed-btn primary">ساخت پیش‌نویس (هنوز منتشر نمی‌شود)</button></form></Modal>}
      {modal === 'versions'  && (
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
