'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
export default function CanvasFrame({width,children,onKeyDown,onDrop}){
 const ref=useRef(null),[body,setBody]=useState(null);
 function initialize(){const doc=ref.current?.contentDocument;if(!doc)return;doc.documentElement.lang='fa';doc.documentElement.dir='rtl';doc.head.replaceChildren();for(const element of document.head.querySelectorAll('link[rel="stylesheet"],style'))doc.head.appendChild(element.cloneNode(true));const style=doc.createElement('style');style.textContent='body{margin:0;background:white} .eb-wrap{min-height:12px}';doc.head.appendChild(style);setBody(doc.body);}
 useEffect(()=>{if(!body)return;const doc=body.ownerDocument;const key=e=>onKeyDown?.(e);const prevent=e=>{if(e.dataTransfer?.types.includes('text/new-block'))e.preventDefault();};const drop=e=>{e.preventDefault();onDrop?.(e);};doc.addEventListener('keydown',key);doc.addEventListener('dragover',prevent);doc.addEventListener('drop',drop);return()=>{doc.removeEventListener('keydown',key);doc.removeEventListener('dragover',prevent);doc.removeEventListener('drop',drop);};},[body,onKeyDown,onDrop]);
 return <iframe ref={ref} title="بوم زنده ویرایشگر" className="ed-frame" onLoad={initialize} srcDoc="<!doctype html><html lang='fa' dir='rtl'><head></head><body></body></html>" style={{width,height:'100%',border:0,background:'#fff'}}>{body&&createPortal(children,body)}</iframe>;
}
