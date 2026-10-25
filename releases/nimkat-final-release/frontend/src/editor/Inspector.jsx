'use client';
/* Inspector — content + style fields for the selected block, with breakpoint tabs */
import {api} from '../api.js';
import { useState } from 'react';
import { registry, findNode, clone, getIn, setIn, uid } from '../blocks/registry.js';

const TOKEN_COLORS = [
  ['Primary', '#0A6847'], ['Primary-900', '#053D29'], ['Fresh Green', '#21A878'], ['Orange', '#F28A3D'],
  ['N900', '#17211E'], ['N700', '#46514D'], ['N500', '#89938F'], ['N200', '#D9E1DE'], ['N50', '#F3F6F4'],
  ['Error', '#B42A48'], ['Accent-800', '#9C4F14'], ['Secondary-50', '#E3F4EC'], ['سفید', '#ffffff'],
];

const STYLE_FIELDS = [
  ['width','عرض (px یا درصد)','text'],
  ['minHeight','حداقل ارتفاع (px)','number'],
  ['paddingLeft','فاصله چپ (px)','number'],
  ['paddingRight','فاصله راست (px)','number'],
  ['gap','فاصله فرزندان (px)','number'],
  ['fontSize','اندازه قلم (حداقل ۱۲px)','number'],
  ['fontWeight','وزن قلم','number'],
  ['lineHeight','ارتفاع خط (نسبت)','number'],
  ['borderWidth','ضخامت کادر (px)','number'],
  ['borderColor','رنگ کادر','color'],
  ['backgroundColor', 'رنگ پس‌زمینه', 'color'],
  ['color', 'رنگ متن', 'color'],
  ['paddingTop', 'فاصله بالا (px)', 'number'],
  ['paddingBottom', 'فاصله پایین (px)', 'number'],
  ['marginTop', 'حاشیه بالا (px)', 'number'],
  ['marginBottom', 'حاشیه پایین (px)', 'number'],
  ['borderRadius', 'گردی گوشه (px)', 'number'],
  ['maxWidth', 'حداکثر عرض (px)', 'number'],
  ['boxShadow', 'سایه (CSS)', 'text'],
  ['textAlign', 'چیدمان متن', 'align'],
];

function Field({ field, value, onChange }) {
  if(field.key==='src')return <MediaField label={field.label} value={value} onChange={onChange}/>;
  if (field.type === 'toggle') {
    return (
      <label className="insp-row">
        <span>{field.label}</span>
        <button type="button" className={`toggle ${value ? 'is-on' : ''}`} onClick={() => onChange(!value)} />
      </label>
    );
  }
  if (field.type === 'select') {
    return (
      <label className="insp-row">
        <span>{field.label}</span>
        <select className="insp-input" aria-label={field.label} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {(field.options || []).map((o) => <option key={o} value={o}>{o || '—'}</option>)}
        </select>
      </label>
    );
  }
  if (field.type === 'textarea') {
    return (
      <label className="insp-col">
        <span>{field.label}</span>
        <textarea className="insp-input" aria-label={field.label} rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }
  if (field.type === 'number') {
    return (
      <label className="insp-row">
        <span>{field.label}</span>
        <input className="insp-input num" type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
      </label>
    );
  }
  if (field.type === 'tags') {
    return (
      <label className="insp-col">
        <span>{field.label}</span>
        <input className="insp-input" value={(value || []).join(' | ')} onChange={(e) => onChange(e.target.value.split('|').map((x) => x.trim()).filter(Boolean))} />
      </label>
    );
  }
  return (
    <label className="insp-col">
      <span>{field.label}</span>
      <input className="insp-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function ListField({ field, value, onChange }) {
  const items = value || [];
  const [open, setOpen] = useState(-1);
  const updateItem = (i, k, v) => {
    const next = items.map((it, idx) => {
      if (idx !== i) return it;
      const copy = clone(it);
      setIn(copy, k, v);
      return copy;
    });
    onChange(next);
  };
  return (
    <div className="insp-list">
      <div className="insp-list-head">
        <span>{field.label}</span>
        <button type="button" className="insp-mini-btn" onClick={() => {
          const proto = {};
          (field.fields || []).forEach((f) => { proto[f.key] = f.type === 'tags' ? [] : f.type === 'number' ? 0 : f.type === 'toggle' ? false : ''; });
          onChange([...items, proto]);
          setOpen(items.length);
        }}>+ افزودن</button>
      </div>
      {items.map((it, i) => (
        <div className="insp-item" key={i}>
          <button type="button" className="insp-item-head" onClick={() => setOpen(open === i ? -1 : i)}>
            <span>{String(getIn(it, field.itemLabel || 'title') || `آیتم ${i + 1}`).slice(0, 32)}</span>
            <span>{open === i ? '−' : '+'}</span>
          </button>
          {open === i && (
            <div className="insp-item-body">
              {(field.fields || []).map((f) => (
                <Field key={f.key} field={f} value={getIn(it, f.key)} onChange={(v) => updateItem(i, f.key, v)} />
              ))}
              <div className="insp-item-actions">
                <button type="button" className="insp-mini-btn" onClick={() => {
                  const copy = clone(items);
                  copy.splice(i + 1, 0, clone(it));
                  onChange(copy);
                }}>کپی</button>
                <button type="button" className="insp-mini-btn danger" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>حذف</button>
                <button type="button" className="insp-mini-btn" onClick={() => {
                  if (i <= 0) return;
                  const copy = clone(items);
                  [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
                  onChange(copy);
                }}>↑</button>
                <button type="button" className="insp-mini-btn" onClick={() => {
                  if (i >= items.length - 1) return;
                  const copy = clone(items);
                  [copy[i + 1], copy[i]] = [copy[i], copy[i + 1]];
                  onChange(copy);
                }}>↓</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Inspector({ store, breakpoint, setBreakpoint }) {
  const { schema, selectedId, setProp, setStyle } = store;
  const found = selectedId ? findNode(schema.root, selectedId) : null;

  if (!found) {
    return (
      <div className="insp empty">
        <div className="insp-empty-msg">
          <b>ویرایشگر صفحه</b>
          <p>روی یک بلوک در صفحه یا لایه‌ها کلیک کنید تا ویرایشش کنید.</p>
          <p className="t-caption t-muted">نکته: Ctrl+Z برای بازگردانی، Ctrl+S برای ذخیره.</p>
        </div>
      </div>
    );
  }

  const { node } = found;
  const spec = registry[node.type];
  const style = (node.style && node.style[breakpoint]) || {};

  return (
    <div className="insp">
      <div className="insp-title">
        <b>{spec?.label || node.type}</b>
        <span className="t-caption t-muted">{node.type}</span>
      </div>

      <div className="insp-tabs">
        {[['desktop', 'دسکتاپ'], ['tablet', 'تبلت'], ['mobile', 'موبایل']].map(([k, label]) => (
          <button key={k} type="button" className={breakpoint === k ? 'is-on' : ''} onClick={() => setBreakpoint(k)}>{label}</button>
        ))}
      </div>

      <div className="insp-section">
        <div className="insp-section-title">محتوا</div>
        {(spec?.fields || []).map((f) =>
          f.type === 'list' ? (
            <ListField key={f.key} field={f} value={getIn(node.props, f.key)} onChange={(v) => setProp(node.id, f.key, v)} />
          ) : (
            <Field key={f.key} field={f} value={getIn(node.props, f.key)} onChange={(v) => setProp(node.id, f.key, v)} />
          )
        )}
      </div>

      <div className="insp-section">
        {registry[node.type]?.container&&<><Field field={{label:'نوع چیدمان',type:'select',options:['','block','flex','grid']}} value={style.display} onChange={v=>setStyle(node.id,breakpoint,'display',v)}/><Field field={{label:'جهت چیدمان',type:'select',options:['','row','column','row-reverse','column-reverse']}} value={style.flexDirection} onChange={v=>setStyle(node.id,breakpoint,'flexDirection',v)}/><Field field={{label:'شکستن ردیف',type:'select',options:['','wrap','nowrap']}} value={style.flexWrap} onChange={v=>setStyle(node.id,breakpoint,'flexWrap',v)}/><Field field={{label:'ستون‌های شبکه (CSS)',type:'text'}} value={style.gridTemplateColumns} onChange={v=>setStyle(node.id,breakpoint,'gridTemplateColumns',v)}/><Field field={{label:'تراز محتوا',type:'select',options:['','start','center','end','space-between','space-around']}} value={style.justifyContent} onChange={v=>setStyle(node.id,breakpoint,'justifyContent',v)}/></>}
        <label className="insp-row">نمایش در این دستگاه<input type="checkbox" checked={node.visibility?.[breakpoint]!==false} onChange={e=>store.apply(s=>{const f=findNode(s.root,node.id);f.node.visibility={...f.node.visibility,[breakpoint]:e.target.checked};})}/></label>
        <button type="button" className="insp-mini-btn" onClick={()=>store.resetStyle(node.id,breakpoint)}>پاک‌کردن استایل همین دستگاه</button>
        <div className="insp-section-title">استایل ({breakpoint === 'desktop' ? 'دسکتاپ' : breakpoint === 'tablet' ? 'تبلت' : 'موبایل'})</div>
        {STYLE_FIELDS.map(([k, label, type]) => (
          <div key={k}>
            {type === 'color' ? (
              <label className="insp-col">
                <span>{label}</span>
                <div className="insp-colors">
                  {TOKEN_COLORS.map(([name, hex]) => (
                    <button key={hex} type="button" title={name} className={`swatch ${style[k] === hex ? 'is-on' : ''}`} style={{ background: hex }} onClick={() => setStyle(node.id, breakpoint, k, style[k] === hex ? '' : hex)} />
                  ))}
                  <button type="button" className="insp-mini-btn" onClick={()=>setStyle(node.id,breakpoint,k,'')}>ارث‌بری</button>
                </div>
              </label>
            ) : type === 'align' ? (
              <label className="insp-row">
                <span>{label}</span>
                <select className="insp-input" value={style[k] || ''} onChange={(e) => setStyle(node.id, breakpoint, k, e.target.value)}>
                  <option value="">—</option><option value="right">راست</option><option value="center">وسط</option><option value="left">چپ</option>
                </select>
              </label>
            ) : (
              <Field field={{ key: k, label, type }} value={style[k]} onChange={(v) => setStyle(node.id, breakpoint, k, v)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaField({label,value,onChange}){const [items,setItems]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);async function library(){try{setItems((await api('/editor/media')).media);}catch(e){setError(e.message);}}return <div className="insp-col"><label>{label}<input className="insp-input" value={value||''} onChange={e=>onChange(e.target.value)}/></label><button className="insp-mini-btn" type="button" onClick={library}>کتابخانهٔ تصاویر</button><label>بارگذاری تصویر (حداکثر ۵ مگابایت)<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setBusy(true);setError('');try{if(file.size>5*1024*1024)throw new Error('حداکثر حجم تصویر پنج مگابایت است.');const r=await api('/editor/media',{method:'POST',raw:true,body:file,headers:{'Content-Type':file.type}});onChange(r.media.url);await library();}catch(e){setError(e.message);}finally{setBusy(false);}}}/></label><p className="ed-hint">تصویر منتشرشدنی است؛ فایل خصوصی بارگذاری نکنید. متادیتا حذف و خروجی WebP می‌شود.</p>{error&&<p role="alert">{error}</p>}{items&&<div className="ed-media-grid">{items.map(m=><button type="button" key={m.id} onClick={()=>{onChange(m.url);setItems(null);}} aria-label={`انتخاب تصویر ${m.id}`}><img src={m.url} width="72" height="60" alt=""/></button>)}</div>}</div>;}
